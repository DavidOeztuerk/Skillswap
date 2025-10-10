using Infrastructure.Communication;
using Contracts.Notification.Requests;
using Contracts.Notification.Responses;
using Microsoft.Extensions.Logging;

namespace UserService.Infrastructure.HttpClients;

public interface INotificationServiceClient
{
    Task<bool> SendWelcomeNotificationAsync(string userId, string firstName, CancellationToken cancellationToken = default);
    Task<bool> SendEmailVerificationNotificationAsync(string userId, string email, string verificationToken, CancellationToken cancellationToken = default);
    Task<bool> SendPasswordResetNotificationAsync(string userId, string email, string resetToken, CancellationToken cancellationToken = default);
    Task<bool> SendAccountBlockedNotificationAsync(string userId, string email, string reason, CancellationToken cancellationToken = default);
    Task<bool> SendAccountUnblockedNotificationAsync(string userId, string email, CancellationToken cancellationToken = default);
    Task<bool> SendProfileUpdatedNotificationAsync(string userId, string changesSummary, CancellationToken cancellationToken = default);
    Task<bool> Send2FAEnabledNotificationAsync(string userId, string email, CancellationToken cancellationToken = default);
    Task<bool> SendSkillAddedNotificationAsync(string userId, string skillName, CancellationToken cancellationToken = default);
    Task<bool> DeleteUserNotificationsAsync(string userId, CancellationToken cancellationToken = default);
}

public class NotificationServiceClient : INotificationServiceClient
{
    private readonly IServiceCommunicationManager _serviceCommunication;
    private readonly ILogger<NotificationServiceClient> _logger;

    public NotificationServiceClient(IServiceCommunicationManager serviceCommunication, ILogger<NotificationServiceClient> logger)
    {
        _serviceCommunication = serviceCommunication;
        _logger = logger;
    }

    public async Task<bool> SendWelcomeNotificationAsync(string userId, string firstName, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Sending welcome notification to user {UserId}", userId);

            var request = new SendNotificationRequest(
                Type: "Email",
                Template: "Welcome",
                Recipient: userId,
                Variables: new Dictionary<string, string>
                {
                    ["firstName"] = firstName,
                    ["onboardingStep"] = "welcome",
                    ["title"] = "Welcome to SkillSwap!",
                    ["message"] = $"Hi {firstName}! Welcome to SkillSwap. Start by adding your skills and finding learning opportunities."
                });

            var response = await _serviceCommunication.SendRequestAsync<SendNotificationRequest, SendNotificationResponse>(
                "notificationservice",
                "api/notifications/send",
                request,
                cancellationToken);

            var success = response != null;
            _logger.LogDebug("Welcome notification sent: {Success}", success);
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending welcome notification for user {UserId}", userId);
            return false;
        }
    }

    public async Task<bool> SendEmailVerificationNotificationAsync(string userId, string email, string verificationToken, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Sending email verification notification to user {UserId}", userId);

            var request = new SendNotificationRequest(
                Type: "Email",
                Template: "EmailVerification",
                Recipient: userId,
                Variables: new Dictionary<string, string>
                {
                    ["email"] = email,
                    ["verificationToken"] = verificationToken,
                    ["verificationUrl"] = $"https://skillswap.com/verify-email?token={verificationToken}",
                    ["title"] = "Verify Your Email Address",
                    ["message"] = "Please click the link to verify your email address and complete your registration."
                });

            var response = await _serviceCommunication.SendRequestAsync<SendNotificationRequest, SendNotificationResponse>(
                "notificationservice",
                "api/notifications/send",
                request,
                cancellationToken);

            var success = response != null;
            _logger.LogDebug("Email verification notification sent: {Success}", success);
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending email verification notification for user {UserId}", userId);
            return false;
        }
    }

    public async Task<bool> SendPasswordResetNotificationAsync(string userId, string email, string resetToken, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Sending password reset notification to user {UserId}", userId);

            var request = new SendNotificationRequest(
                Type: "Email",
                Template: "PasswordReset",
                Recipient: userId,
                Variables: new Dictionary<string, string>
                {
                    ["email"] = email,
                    ["resetToken"] = resetToken,
                    ["resetUrl"] = $"https://skillswap.com/reset-password?token={resetToken}",
                    ["expiresIn"] = "1 hour",
                    ["title"] = "Reset Your Password",
                    ["message"] = "You requested a password reset. Click the link to create a new password."
                });

            var response = await _serviceCommunication.SendRequestAsync<SendNotificationRequest, SendNotificationResponse>(
                "notificationservice",
                "api/notifications/send",
                request,
                cancellationToken);

            var success = response != null;
            _logger.LogDebug("Password reset notification sent: {Success}", success);
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending password reset notification for user {UserId}", userId);
            return false;
        }
    }

    public async Task<bool> SendAccountBlockedNotificationAsync(string userId, string email, string reason, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Sending account blocked notification to user {UserId}", userId);

            var request = new SendNotificationRequest(
                Type: "Email",
                Template: "AccountBlocked",
                Recipient: userId,
                Variables: new Dictionary<string, string>
                {
                    ["email"] = email,
                    ["reason"] = reason,
                    ["supportEmail"] = "support@skillswap.com",
                    ["title"] = "Account Temporarily Blocked",
                    ["message"] = $"Your account has been temporarily blocked. Reason: {reason}. Contact support if you believe this is an error."
                });

            var response = await _serviceCommunication.SendRequestAsync<SendNotificationRequest, SendNotificationResponse>(
                "notificationservice",
                "api/notifications/send",
                request,
                cancellationToken);

            var success = response != null;
            _logger.LogDebug("Account blocked notification sent: {Success}", success);
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending account blocked notification for user {UserId}", userId);
            return false;
        }
    }

    public async Task<bool> SendAccountUnblockedNotificationAsync(string userId, string email, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Sending account unblocked notification to user {UserId}", userId);

            var request = new SendNotificationRequest(
                Type: "Email",
                Template: "AccountUnblocked",
                Recipient: userId,
                Variables: new Dictionary<string, string>
                {
                    ["email"] = email,
                    ["loginUrl"] = "https://skillswap.com/login",
                    ["title"] = "Account Access Restored",
                    ["message"] = "Your account access has been restored. You can now log in and use all features."
                });

            var response = await _serviceCommunication.SendRequestAsync<SendNotificationRequest, SendNotificationResponse>(
                "notificationservice",
                "api/notifications/send",
                request,
                cancellationToken);

            var success = response != null;
            _logger.LogDebug("Account unblocked notification sent: {Success}", success);
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending account unblocked notification for user {UserId}", userId);
            return false;
        }
    }

    public async Task<bool> SendProfileUpdatedNotificationAsync(string userId, string changesSummary, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Sending profile updated notification to user {UserId}", userId);

            var request = new SendNotificationRequest(
                Type: "Email",
                Template: "ProfileUpdated",
                Recipient: userId,
                Variables: new Dictionary<string, string>
                {
                    ["changesSummary"] = changesSummary,
                    ["timestamp"] = DateTime.UtcNow.ToString("O"),
                    ["title"] = "Profile Updated",
                    ["message"] = $"Your profile has been updated successfully. Changes: {changesSummary}"
                });

            var response = await _serviceCommunication.SendRequestAsync<SendNotificationRequest, SendNotificationResponse>(
                "notificationservice",
                "api/notifications/send",
                request,
                cancellationToken);

            var success = response != null;
            _logger.LogDebug("Profile updated notification sent: {Success}", success);
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending profile updated notification for user {UserId}", userId);
            return false;
        }
    }

    public async Task<bool> Send2FAEnabledNotificationAsync(string userId, string email, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Sending 2FA enabled notification to user {UserId}", userId);

            var request = new SendNotificationRequest(
                Type: "Email",
                Template: "2FAEnabled",
                Recipient: userId,
                Variables: new Dictionary<string, string>
                {
                    ["email"] = email,
                    ["enabledAt"] = DateTime.UtcNow.ToString("O"),
                    ["title"] = "Two-Factor Authentication Enabled",
                    ["message"] = "Two-factor authentication has been successfully enabled for your account. Your account is now more secure."
                });

            var response = await _serviceCommunication.SendRequestAsync<SendNotificationRequest, SendNotificationResponse>(
                "notificationservice",
                "api/notifications/send",
                request,
                cancellationToken);

            var success = response != null;
            _logger.LogDebug("2FA enabled notification sent: {Success}", success);
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending 2FA enabled notification for user {UserId}", userId);
            return false;
        }
    }

    public async Task<bool> SendSkillAddedNotificationAsync(string userId, string skillName, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Sending skill added notification to user {UserId}", userId);

            var request = new SendNotificationRequest(
                Type: "Email",
                Template: "SkillAdded",
                Recipient: userId,
                Variables: new Dictionary<string, string>
                {
                    ["skillName"] = skillName,
                    ["addedAt"] = DateTime.UtcNow.ToString("O"),
                    ["title"] = "New Skill Added",
                    ["message"] = $"You've successfully added '{skillName}' to your skill portfolio!"
                });

            var response = await _serviceCommunication.SendRequestAsync<SendNotificationRequest, SendNotificationResponse>(
                "notificationservice",
                "api/notifications/send",
                request,
                cancellationToken);

            var success = response != null;
            _logger.LogDebug("Skill added notification sent: {Success}", success);
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending skill added notification for user {UserId}", userId);
            return false;
        }
    }

    public async Task<bool> DeleteUserNotificationsAsync(string userId, CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask; // Placeholder to avoid compiler warning
        try
        {
            _logger.LogDebug("Deleting all notifications for user {UserId}", userId);

            // This would need to be implemented in NotificationService
            // For now, we'll just log the intent
            _logger.LogInformation("Request to delete all notifications for user {UserId}", userId);

            // TODO: Implement bulk delete endpoint in NotificationService
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting notifications for user {UserId}", userId);
            return false;
        }
    }
}
