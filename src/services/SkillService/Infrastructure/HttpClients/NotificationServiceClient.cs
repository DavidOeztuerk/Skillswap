using Infrastructure.Communication;
using Contracts.Notification.Requests;
using Contracts.Notification.Responses;

namespace SkillService.Infrastructure.HttpClients;

public interface INotificationServiceClient
{
    Task<bool> SendSkillCreatedNotificationAsync(string userId, string skillName, CancellationToken cancellationToken = default);
    Task<bool> SendSkillUpdatedNotificationAsync(string userId, string skillName, string changesSummary, CancellationToken cancellationToken = default);
    Task<bool> SendSkillDeletedNotificationAsync(string userId, string skillName, CancellationToken cancellationToken = default);
    Task<bool> SendSkillVerificationNotificationAsync(string userId, string skillName, string verificationStatus, CancellationToken cancellationToken = default);
    Task<bool> SendSkillEndorsementNotificationAsync(string userId, string skillName, string endorserName, CancellationToken cancellationToken = default);
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
}