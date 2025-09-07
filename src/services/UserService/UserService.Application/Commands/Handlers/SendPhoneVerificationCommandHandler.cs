using System.Security.Cryptography;
using Contracts.Events;
using Contracts.User.Responses;
using CQRS.Handlers;
using CQRS.Models;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using UserService.Domain.Repositories;
using Core.Common.Exceptions;

namespace UserService.Application.Commands.Handlers;

public class SendPhoneVerificationCommandHandler(
    IUserRepository context,
    IPublishEndpoint publishEndpoint,
    IConfiguration configuration,
    ILogger<SendPhoneVerificationCommandHandler> logger)
    : BaseCommandHandler<SendPhoneVerificationCommand, PhoneVerificationResponse>(logger)
{
    private readonly IUserRepository _context = context;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;
    private readonly IConfiguration _configuration = configuration;
    private readonly int _maxDailyAttempts = 5;
    private readonly int _cooldownMinutes = 1;
    private readonly int _expirationMinutes = 10;

    public override async Task<ApiResponse<PhoneVerificationResponse>> Handle(
        SendPhoneVerificationCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Validate phone number format
            var cleanedPhone = CleanPhoneNumber(request.PhoneNumber);
            if (!IsValidPhoneNumber(cleanedPhone))
            {
                return Error("Invalid phone number format", ErrorCodes.InvalidPhoneNumber);
            }

            if (request.UserId is null)
                return Error("UserId is required", ErrorCodes.RequiredFieldMissing);

            // Get user
                var user = await _context.GetUserById(request.UserId, cancellationToken);

            if (user == null)
            {
                return Error("User not found", ErrorCodes.ResourceNotFound);
            }

            // Check if phone is already verified
            if (user.PhoneVerified && user.PhoneNumber == cleanedPhone)
            {
                return Success(new PhoneVerificationResponse(false, "Phone number already verified")
                {
                    AttemptsRemaining = 0
                });
            }

            // Check cooldown
            if (user.PhoneVerificationCooldownUntil.HasValue && 
                DateTime.UtcNow < user.PhoneVerificationCooldownUntil.Value)
            {
                var remainingSeconds = (int)(user.PhoneVerificationCooldownUntil.Value - DateTime.UtcNow).TotalSeconds;
                return Success(new PhoneVerificationResponse(false, $"Please wait {remainingSeconds} seconds before requesting another code")
                {
                    CooldownUntil = user.PhoneVerificationCooldownUntil,
                    AttemptsRemaining = _maxDailyAttempts - user.PhoneVerificationAttempts
                });
            }

            // Reset attempts if it's a new day
            if (user.PhoneVerificationSentAt.HasValue && 
                user.PhoneVerificationSentAt.Value.Date < DateTime.UtcNow.Date)
            {
                user.PhoneVerificationAttempts = 0;
            }

            // Check daily attempts limit
            if (user.PhoneVerificationAttempts >= _maxDailyAttempts)
            {
                return Success(new PhoneVerificationResponse(false, "Daily verification limit reached. Please try again tomorrow.")
                {
                    AttemptsRemaining = 0
                });
            }

            // Generate verification code
            var verificationCode = GenerateVerificationCode();
            
            // Update user with verification details
            user.PhoneNumber = cleanedPhone;
            user.PhoneVerificationCode = HashVerificationCode(verificationCode);
            user.PhoneVerificationSentAt = DateTime.UtcNow;
            user.PhoneVerificationExpiresAt = DateTime.UtcNow.AddMinutes(_expirationMinutes);
            user.PhoneVerificationCooldownUntil = DateTime.UtcNow.AddMinutes(_cooldownMinutes);
            user.PhoneVerificationAttempts++;
            user.PhoneVerified = false;

            await _context.UpdateUser(user, cancellationToken);

            // Publish event for SMS service to handle
            await _publishEndpoint.Publish(new PhoneVerificationRequestedEvent
            {
                UserId = user.Id,
                PhoneNumber = cleanedPhone,
                VerificationCode = verificationCode,
                ExpiresAt = user.PhoneVerificationExpiresAt.Value,
                Timestamp = DateTime.UtcNow
            }, cancellationToken);

            Logger.LogInformation(
                "Phone verification code sent to user {UserId} at {PhoneNumber}",
                user.Id, cleanedPhone);

            return Success(new PhoneVerificationResponse(true, $"Verification code sent to {MaskPhoneNumber(cleanedPhone)}")
            {
                CooldownUntil = user.PhoneVerificationCooldownUntil,
                AttemptsRemaining = _maxDailyAttempts - user.PhoneVerificationAttempts,
                ExpiresAt = user.PhoneVerificationExpiresAt,
                MaskedPhoneNumber = MaskPhoneNumber(cleanedPhone)
            });
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error sending phone verification for user {UserId}", request.UserId);
            return Error("Failed to send verification code", ErrorCodes.SmsServiceError);
        }
    }

    private static string GenerateVerificationCode()
    {
        using var rng = RandomNumberGenerator.Create();
        var bytes = new byte[3];
        rng.GetBytes(bytes);
        var code = BitConverter.ToUInt32(bytes, 0) % 1000000;
        return code.ToString("D6");
    }

    private static string HashVerificationCode(string code)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(code));
        return Convert.ToBase64String(hashedBytes);
    }

    private static string CleanPhoneNumber(string phoneNumber)
    {
        // Remove all non-digit characters
        var cleaned = System.Text.RegularExpressions.Regex.Replace(phoneNumber, @"\D", "");
        
        // Add country code if not present (assuming US)
        if (cleaned.Length == 10)
        {
            cleaned = "1" + cleaned;
        }
        
        return "+" + cleaned;
    }

    private static bool IsValidPhoneNumber(string phoneNumber)
    {
        // Basic validation: must start with + and have 10-15 digits
        var pattern = @"^\+[1-9]\d{9,14}$";
        return System.Text.RegularExpressions.Regex.IsMatch(phoneNumber, pattern);
    }

    private static string MaskPhoneNumber(string phoneNumber)
    {
        if (phoneNumber.Length < 8) return phoneNumber;
        
        var lastFour = phoneNumber.Substring(phoneNumber.Length - 4);
        var masked = new string('*', phoneNumber.Length - 4) + lastFour;
        return masked;
    }
}