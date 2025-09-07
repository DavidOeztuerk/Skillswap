using Microsoft.Extensions.Logging;
using UserService.Application.Commands;
using EventSourcing;
using Events.Domain.User;
using System.Security.Cryptography;
using CQRS.Handlers;
using CQRS.Models;
using UserService.Domain.Repositories;
using Core.Common.Exceptions;

namespace UserService.Application.CommandHandlers;

public class RequestPhoneVerificationCommandHandler(
    IUserRepository userRepository,
    IDomainEventPublisher eventPublisher,
    ILogger<RequestPhoneVerificationCommandHandler> logger)
    : BaseCommandHandler<RequestPhoneVerificationCommand, string>(logger)
{
    private readonly IUserRepository _userRepository = userRepository;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<string>> Handle(RequestPhoneVerificationCommand request, CancellationToken cancellationToken)
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
                return Error("Phone number is already verified", ErrorCodes.InvalidOperation);
            }

            // Check rate limiting (max 3 attempts per hour)
            if (user.PhoneVerificationExpiresAt > DateTime.UtcNow &&
                user.PhoneVerificationAttempts >= 3)
            {
                var minutesRemaining = (user.PhoneVerificationExpiresAt.Value - DateTime.UtcNow).TotalMinutes;
                return Error($"Too many verification attempts. Please try again in {Math.Ceiling(minutesRemaining)} minutes.", ErrorCodes.RateLimitExceeded);
            }

            // Generate 6-digit verification code
            var verificationCode = GenerateVerificationCode();

            // Update user with verification details
            user.PhoneNumber = request.PhoneNumber;
            user.PhoneVerificationCode = verificationCode;
            user.PhoneVerificationExpiresAt = DateTime.UtcNow.AddMinutes(10); // 10 minutes expiry
            user.PhoneVerificationAttempts = user.PhoneVerificationExpiresAt > DateTime.UtcNow
                ? user.PhoneVerificationAttempts + 1
                : 1;
            user.UpdatedAt = DateTime.UtcNow;

            await _userRepository.UpdateUser(user, cancellationToken);

            // Publish event for SMS notification
            await _eventPublisher.Publish(new PhoneVerificationRequestedDomainEvent(
                user.Id,
                user.Email,
                request.PhoneNumber,
                verificationCode,
                user.FirstName), cancellationToken);

            Logger.LogInformation("Phone verification code sent to user {UserId}", user.Id);

            return Success(
                "Verification code sent",
                $"A verification code has been sent to {MaskPhoneNumber(request.PhoneNumber)}");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error requesting phone verification for user {UserId}", request.UserId);
            return Error("Failed to send verification code", ErrorCodes.SmsServiceError);
        }
    }

    private static string GenerateVerificationCode()
    {
        using var rng = RandomNumberGenerator.Create();
        var bytes = new byte[4];
        rng.GetBytes(bytes);
        var code = BitConverter.ToUInt32(bytes, 0) % 1000000;
        return code.ToString("D6");
    }

    private static string MaskPhoneNumber(string phoneNumber)
    {
        if (phoneNumber.Length <= 4)
            return phoneNumber;

        var lastFour = phoneNumber[^4..];
        var masked = new string('*', phoneNumber.Length - 4);
        return $"{masked}{lastFour}";
    }
}