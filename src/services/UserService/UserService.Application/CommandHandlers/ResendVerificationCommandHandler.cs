using System.Security.Cryptography;
using Contracts.Events;
using Contracts.User.Responses;
using CQRS.Handlers;
using CQRS.Models;
using MassTransit;
using Microsoft.Extensions.Logging;
using UserService.Domain.Repositories;
using Core.Common.Exceptions;
using UserService.Application.Commands;

namespace UserService.Application.CommandHandlers;

public class ResendVerificationCommandHandler(
    IUserRepository context,
    IPublishEndpoint publishEndpoint,
    ILogger<ResendVerificationCommandHandler> logger)
    : BaseCommandHandler<ResendVerificationCommand, ResendVerificationResponse>(logger)
{
    private readonly IUserRepository _context = context;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;
    private readonly int _cooldownMinutes = 1;
    private readonly int _expirationHours = 24;

    public override async Task<ApiResponse<ResendVerificationResponse>> Handle(
        ResendVerificationCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation("Processing email verification resend for {Email}", request.Email);

            // Validate email format
            if (string.IsNullOrWhiteSpace(request.Email) || !IsValidEmail(request.Email))
            {
                return Error("Invalid email format", ErrorCodes.InvalidEmail);
            }

            // Find user by email
            var user = await _context.GetUserByEmail(request.Email, cancellationToken);
            if (user == null)
            {
                Logger.LogWarning("User not found with email {Email}", request.Email);
                // Don't reveal if email exists for security
                return Success(new ResendVerificationResponse(
                    Success: true,
                    Message: "If the email exists, a verification email has been sent."
                ));
            }

            // Check if already verified
            if (user.EmailVerified)
            {
                Logger.LogInformation("User {Email} is already verified", request.Email);
                return Success(new ResendVerificationResponse(
                    Success: true,
                    Message: "Email is already verified."
                ));
            }

            // Check rate limiting - prevent spam
            if (user.EmailVerificationSentAt.HasValue)
            {
                var timeSinceLastSent = DateTime.UtcNow - user.EmailVerificationSentAt.Value;
                var minInterval = TimeSpan.FromMinutes(_cooldownMinutes);

                if (timeSinceLastSent < minInterval)
                {
                    var waitTime = (int)(minInterval - timeSinceLastSent).TotalSeconds;
                    Logger.LogWarning("Rate limit hit for email verification resend for {Email}", request.Email);
                    return Error($"Please wait {waitTime} seconds before requesting another verification email.", ErrorCodes.RateLimitExceeded);
                }
            }

            // Generate new verification code
            var verificationCode = GenerateVerificationCode();
            var hashedCode = HashVerificationCode(verificationCode);

            // Update user with new verification code
            user.EmailVerificationToken = hashedCode;
            user.EmailVerificationTokenExpiresAt = DateTime.UtcNow.AddHours(_expirationHours);
            user.EmailVerificationSentAt = DateTime.UtcNow;

            await _context.UpdateUser(user, cancellationToken);

            // Publish event for NotificationService to send email
            var emailVerificationEvent = new UserEmailVerificationRequestedEvent(
                user.Id,
                user.Email,
                verificationCode,
                user.UserName ?? "User",
                user.EmailVerificationTokenExpiresAt.Value,
                DateTime.UtcNow
            );

            await _publishEndpoint.Publish(emailVerificationEvent, cancellationToken);

            Logger.LogInformation("Email verification event published for {Email}", request.Email);

            return Success(new ResendVerificationResponse(
                Success: true,
                Message: "Verification email has been sent. Please check your inbox."
            ));
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error resending verification email for {Email}", request.Email);
            return Error("Failed to resend verification email. Please try again later.", ErrorCodes.EmailServiceError);
        }
    }

    private string GenerateVerificationCode()
    {
        // Generate a 6-digit numeric code
        using var rng = RandomNumberGenerator.Create();
        var bytes = new byte[4];
        rng.GetBytes(bytes);
        var code = Math.Abs(BitConverter.ToInt32(bytes, 0)) % 1000000;
        return code.ToString("D6");
    }

    private string HashVerificationCode(string code)
    {
        using var sha256 = SHA256.Create();
        var bytes = System.Text.Encoding.UTF8.GetBytes(code);
        var hash = sha256.ComputeHash(bytes);
        return Convert.ToBase64String(hash);
    }

    private bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }
}