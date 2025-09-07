using Microsoft.Extensions.Logging;
using UserService.Application.Commands;
using EventSourcing;
using CQRS.Handlers;
using CQRS.Models;
using Events.Domain.User;
using UserService.Domain.Repositories;
using Core.Common.Exceptions;

namespace UserService.Application.CommandHandlers;

public class ConfirmPhoneVerificationCommandHandler(
    IUserRepository userRepository,
    IDomainEventPublisher eventPublisher,
    ILogger<ConfirmPhoneVerificationCommandHandler> logger)
    : BaseCommandHandler<ConfirmPhoneVerificationCommand, bool>(logger)
{
    private readonly IUserRepository _userRepository = userRepository;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<bool>> Handle(ConfirmPhoneVerificationCommand request, CancellationToken cancellationToken)
    {
        try
        {
            if (request.UserId is null)
                return Error("UserId is required", ErrorCodes.RequiredFieldMissing);

            var user = await _userRepository.GetUserById(request.UserId, cancellationToken);

            if (user == null)
            {
                return Error("User not found", ErrorCodes.ResourceNotFound);
            }

            // Check if phone is already verified
            if (user.PhoneVerified)
            {
                return Success(true, "Phone number is already verified");
            }

            // Check if verification code exists and is not expired
            if (string.IsNullOrEmpty(user.PhoneVerificationCode) ||
                user.PhoneVerificationExpiresAt == null ||
                user.PhoneVerificationExpiresAt < DateTime.UtcNow)
            {
                return Error("Verification code has expired. Please request a new one.", ErrorCodes.TokenExpired);
            }

            // Check if code matches
            if (user.PhoneVerificationCode != request.VerificationCode)
            {
                user.PhoneVerificationAttempts++;

                // Lock after 5 failed attempts
                if (user.PhoneVerificationAttempts >= 5)
                {
                    user.PhoneVerificationCode = null;
                    user.PhoneVerificationExpiresAt = null;
                    await _userRepository.UpdateUser(user, cancellationToken);

                    return Error("Too many failed attempts. Please request a new verification code.", ErrorCodes.RateLimitExceeded);
                }

                await _userRepository.UpdateUser(user, cancellationToken);
                return Error($"Invalid verification code. {5 - user.PhoneVerificationAttempts} attempts remaining.", ErrorCodes.InvalidToken);
            }

            // Mark phone as verified
            user.PhoneVerified = true;
            user.PhoneVerifiedAt = DateTime.UtcNow;
            user.PhoneVerificationCode = null;
            user.PhoneVerificationExpiresAt = null;
            user.PhoneVerificationAttempts = 0;
            user.UpdatedAt = DateTime.UtcNow;

            await _userRepository.UpdateUser(user, cancellationToken);

            // Publish event
            await _eventPublisher.Publish(new PhoneVerifiedDomainEvent(
                user.Id,
                user.Email,
                user.PhoneNumber,
                user.FirstName), cancellationToken);

            Logger.LogInformation("Phone verified successfully for user {UserId}", user.Id);

            return Success(true, "Phone number verified successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error confirming phone verification for user {UserId}", request.UserId);
            return Error("Failed to verify phone number", ErrorCodes.InternalError);
        }
    }
}