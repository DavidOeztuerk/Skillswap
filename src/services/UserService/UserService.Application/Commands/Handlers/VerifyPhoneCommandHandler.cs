using System.Security.Cryptography;
using Contracts.Events;
using Contracts.User.Responses;
using CQRS.Handlers;
using CQRS.Models;
using MassTransit;
using Microsoft.Extensions.Logging;
using UserService.Domain.Repositories;

namespace UserService.Application.Commands.Handlers;

public class VerifyPhoneCommandHandler(
    IUserRepository userRepository,
    IPublishEndpoint publishEndpoint,
    ILogger<VerifyPhoneCommandHandler> logger)
    : BaseCommandHandler<VerifyPhoneCommand, VerifyPhoneResponse>(logger)
{
    private readonly IUserRepository _userRepository = userRepository;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;
    private readonly int _maxVerificationAttempts = 3;

    public override async Task<ApiResponse<VerifyPhoneResponse>> Handle(
        VerifyPhoneCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            if (request.UserId is null)
                return Error("");

            // Get user
            var user = await _userRepository.GetUserById(request.UserId, cancellationToken);

            if (user == null)
            {
                return Error("User not found");
            }

            // Check if phone is already verified
            if (user.PhoneVerified)
            {
                return Success(new VerifyPhoneResponse(true, "Phone already verified")
                {
                    PhoneVerified = true,
                    PhoneNumber = user.PhoneNumber
                });
            }

            // Check if verification code exists
            if (string.IsNullOrEmpty(user.PhoneVerificationCode))
            {
                return Error("No verification code found. Please request a new code.");
            }

            // Check if verification code has expired
            if (!user.PhoneVerificationExpiresAt.HasValue || 
                DateTime.UtcNow > user.PhoneVerificationExpiresAt.Value)
            {
                // Clear expired code
                user.PhoneVerificationCode = null;
                user.PhoneVerificationExpiresAt = null;
                await _userRepository.UpdateUser(user, cancellationToken);
                
                return Error("Verification code has expired. Please request a new code.");
            }

            // Verify the code
            var hashedCode = HashVerificationCode(request.VerificationCode);
            if (user.PhoneVerificationCode != hashedCode)
            {
                // Increment failed attempts
                user.PhoneVerificationFailedAttempts++;
                
                if (user.PhoneVerificationFailedAttempts >= _maxVerificationAttempts)
                {
                    // Clear code after max attempts
                    user.PhoneVerificationCode = null;
                    user.PhoneVerificationExpiresAt = null;
                    user.PhoneVerificationFailedAttempts = 0;
                    await _userRepository.UpdateUser(user, cancellationToken);
                    
                    return Error("Maximum verification attempts exceeded. Please request a new code.");
                }
                
                await _userRepository.UpdateUser(user, cancellationToken);
                
                var remainingAttempts = _maxVerificationAttempts - user.PhoneVerificationFailedAttempts;
                return Error($"Invalid verification code. {remainingAttempts} attempts remaining.");
            }

            // Mark phone as verified
            user.PhoneVerified = true;
            user.PhoneVerificationCode = null;
            user.PhoneVerificationExpiresAt = null;
            user.PhoneVerificationSentAt = null;
            user.PhoneVerificationCooldownUntil = null;
            user.PhoneVerificationAttempts = 0;
            user.PhoneVerificationFailedAttempts = 0;

            await _userRepository.UpdateUser(user, cancellationToken);

            // Publish phone verified event
            await _publishEndpoint.Publish(new PhoneVerifiedEvent
            {
                UserId = user.Id,
                PhoneNumber = user.PhoneNumber!,
                VerifiedAt = DateTime.UtcNow,
                Timestamp = DateTime.UtcNow
            }, cancellationToken);

            Logger.LogInformation(
                "Phone verified successfully for user {UserId} with number {PhoneNumber}",
                user.Id, user.PhoneNumber);

            return Success(new VerifyPhoneResponse(true, "Phone number verified successfully")
            {
                PhoneVerified = true,
                PhoneNumber = user.PhoneNumber
            });
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error verifying phone for user {UserId}", request.UserId);
            return Error("Failed to verify phone number");
        }
    }

    private static string HashVerificationCode(string code)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(code));
        return Convert.ToBase64String(hashedBytes);
    }
}