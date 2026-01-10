using SkillService.Domain.Services;
using Infrastructure.Communication;
using Contracts.Notification.Requests;
using Contracts.Notification.Responses;
using Microsoft.Extensions.Logging;

namespace SkillService.Infrastructure.HttpClients;


public class NotificationServiceClient : INotificationServiceClient
{
    private readonly IServiceCommunicationManager _serviceCommunication;
    private readonly ILogger<NotificationServiceClient> _logger;

    public NotificationServiceClient(IServiceCommunicationManager serviceCommunication, ILogger<NotificationServiceClient> logger)
    {
        _serviceCommunication = serviceCommunication;
        _logger = logger;
    }

    public async Task SendNotificationAsync(string userId, string message, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Sending notification to user {UserId}", userId);

            var request = new SendNotificationRequest(
                Type: "Email",
                Template: "GenericNotification",
                Recipient: userId,
                Variables: new Dictionary<string, string>
                {
                    ["message"] = message,
                    ["sentAt"] = DateTime.UtcNow.ToString("O"),
                    ["title"] = "Notification",
                    ["message"] = message
                });

            await _serviceCommunication.SendRequestAsync<SendNotificationRequest, SendNotificationResponse>(
                "notificationservice",
                "api/notifications/send",
                request,
                cancellationToken);

            _logger.LogDebug("Notification sent successfully to user {UserId}", userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending notification to user {UserId}", userId);
            throw;
        }
    }

    public async Task<bool> SendSkillCreatedNotificationAsync(string userId, string skillName, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Sending skill created notification to user {UserId} for skill {SkillName}", userId, skillName);

            var request = new SendNotificationRequest(
                Type: "Email",
                Template: "SkillCreated",
                Recipient: userId,
                Variables: new Dictionary<string, string>
                {
                    ["skillName"] = skillName,
                    ["createdAt"] = DateTime.UtcNow.ToString("O"),
                    ["title"] = "New Skill Added",
                    ["message"] = $"You've successfully added '{skillName}' to your skill portfolio!"
                });

            var response = await _serviceCommunication.SendRequestAsync<SendNotificationRequest, SendNotificationResponse>(
                "notificationservice",
                "api/notifications/send",
                request,
                cancellationToken);

            var success = response != null;
            _logger.LogDebug("Skill created notification sent: {Success}", success);
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending skill created notification for skill {SkillName}", skillName);
            return false;
        }
    }

    public async Task<bool> SendSkillUpdatedNotificationAsync(string userId, string skillName, string changesSummary, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Sending skill updated notification to user {UserId} for skill {SkillName}", userId, skillName);

            var request = new SendNotificationRequest(
                Type: "Email",
                Template: "SkillUpdated",
                Recipient: userId,
                Variables: new Dictionary<string, string>
                {
                    ["skillName"] = skillName,
                    ["changesSummary"] = changesSummary,
                    ["updatedAt"] = DateTime.UtcNow.ToString("O"),
                    ["title"] = "Skill Updated",
                    ["message"] = $"Your skill '{skillName}' has been updated successfully. Changes: {changesSummary}"
                });

            var response = await _serviceCommunication.SendRequestAsync<SendNotificationRequest, SendNotificationResponse>(
                "notificationservice",
                "api/notifications/send",
                request,
                cancellationToken);

            var success = response != null;
            _logger.LogDebug("Skill updated notification sent: {Success}", success);
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending skill updated notification for skill {SkillName}", skillName);
            return false;
        }
    }

    public async Task<bool> SendSkillDeletedNotificationAsync(string userId, string skillName, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Sending skill deleted notification to user {UserId} for skill {SkillName}", userId, skillName);

            var request = new SendNotificationRequest(
                Type: "Email",
                Template: "SkillDeleted",
                Recipient: userId,
                Variables: new Dictionary<string, string>
                {
                    ["skillName"] = skillName,
                    ["deletedAt"] = DateTime.UtcNow.ToString("O"),
                    ["title"] = "Skill Removed",
                    ["message"] = $"Your skill '{skillName}' has been removed from your portfolio."
                });

            var response = await _serviceCommunication.SendRequestAsync<SendNotificationRequest, SendNotificationResponse>(
                "notificationservice",
                "api/notifications/send",
                request,
                cancellationToken);

            var success = response != null;
            _logger.LogDebug("Skill deleted notification sent: {Success}", success);
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending skill deleted notification for skill {SkillName}", skillName);
            return false;
        }
    }

    public async Task<bool> SendSkillVerificationNotificationAsync(string userId, string skillName, string verificationStatus, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Sending skill verification notification to user {UserId} for skill {SkillName}", userId, skillName);

            var request = new SendNotificationRequest(
                Type: "Email",
                Template: "SkillVerification",
                Recipient: userId,
                Variables: new Dictionary<string, string>
                {
                    ["skillName"] = skillName,
                    ["verificationStatus"] = verificationStatus,
                    ["verifiedAt"] = DateTime.UtcNow.ToString("O"),
                    ["title"] = "Skill Verification Update",
                    ["message"] = $"Your skill '{skillName}' verification status has been updated to: {verificationStatus}"
                });

            var response = await _serviceCommunication.SendRequestAsync<SendNotificationRequest, SendNotificationResponse>(
                "notificationservice",
                "api/notifications/send",
                request,
                cancellationToken);

            var success = response != null;
            _logger.LogDebug("Skill verification notification sent: {Success}", success);
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending skill verification notification for skill {SkillName}", skillName);
            return false;
        }
    }

    public async Task<bool> SendSkillEndorsementNotificationAsync(string userId, string skillName, string endorserName, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Sending skill endorsement notification to user {UserId} for skill {SkillName}", userId, skillName);

            var request = new SendNotificationRequest(
                Type: "Email",
                Template: "SkillEndorsement",
                Recipient: userId,
                Variables: new Dictionary<string, string>
                {
                    ["skillName"] = skillName,
                    ["endorserName"] = endorserName,
                    ["endorsedAt"] = DateTime.UtcNow.ToString("O"),
                    ["title"] = "Skill Endorsed",
                    ["message"] = $"Your skill '{skillName}' has been endorsed by {endorserName}!"
                });

            var response = await _serviceCommunication.SendRequestAsync<SendNotificationRequest, SendNotificationResponse>(
                "notificationservice",
                "api/notifications/send",
                request,
                cancellationToken);

            var success = response != null;
            _logger.LogDebug("Skill endorsement notification sent: {Success}", success);
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending skill endorsement notification for skill {SkillName}", skillName);
            return false;
        }
    }

    // =============================================
    // Phase 10: Listing Notification Methods
    // =============================================

    public async Task<bool> SendListingExpiringNotificationAsync(
        string userId,
        string listingId,
        string skillName,
        int daysRemaining,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Sending listing expiring notification to user {UserId} for listing {ListingId}", userId, listingId);

            var request = new SendNotificationRequest(
                Type: "Email",
                Template: "ListingExpiring",
                Recipient: userId,
                Variables: new Dictionary<string, string>
                {
                    ["listingId"] = listingId,
                    ["skillName"] = skillName,
                    ["daysRemaining"] = daysRemaining.ToString(),
                    ["title"] = "Dein Listing läuft bald ab",
                    ["message"] = $"Dein Skill-Listing '{skillName}' läuft in {daysRemaining} Tagen ab. Klicke hier um es zu verlängern."
                });

            var response = await _serviceCommunication.SendRequestAsync<SendNotificationRequest, SendNotificationResponse>(
                "notificationservice",
                "api/notifications/send",
                request,
                cancellationToken);

            var success = response != null;
            _logger.LogDebug("Listing expiring notification sent: {Success}", success);
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending listing expiring notification for listing {ListingId}", listingId);
            return false;
        }
    }

    public async Task<bool> SendListingExpiredNotificationAsync(
        string userId,
        string listingId,
        string skillName,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Sending listing expired notification to user {UserId} for listing {ListingId}", userId, listingId);

            var request = new SendNotificationRequest(
                Type: "Email",
                Template: "ListingExpired",
                Recipient: userId,
                Variables: new Dictionary<string, string>
                {
                    ["listingId"] = listingId,
                    ["skillName"] = skillName,
                    ["expiredAt"] = DateTime.UtcNow.ToString("O"),
                    ["title"] = "Dein Listing ist abgelaufen",
                    ["message"] = $"Dein Skill-Listing '{skillName}' ist abgelaufen und nicht mehr sichtbar. Erstelle ein neues Listing um weiter gefunden zu werden."
                });

            var response = await _serviceCommunication.SendRequestAsync<SendNotificationRequest, SendNotificationResponse>(
                "notificationservice",
                "api/notifications/send",
                request,
                cancellationToken);

            var success = response != null;
            _logger.LogDebug("Listing expired notification sent: {Success}", success);
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending listing expired notification for listing {ListingId}", listingId);
            return false;
        }
    }
}