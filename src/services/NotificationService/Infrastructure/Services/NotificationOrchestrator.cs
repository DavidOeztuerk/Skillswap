using Microsoft.EntityFrameworkCore;
using NotificationService.Domain.Entities;
using System.Text.Json;

namespace NotificationService.Infrastructure.Services;

public class NotificationOrchestrator(
    IEmailService emailService,
    ISmsService smsService,
    IPushNotificationService pushService,
    ILogger<NotificationOrchestrator> logger,
    NotificationDbContext dbContext)
    : INotificationOrchestrator
{
    private readonly IEmailService _emailService = emailService;
    private readonly ISmsService _smsService = smsService;
    private readonly IPushNotificationService _pushService = pushService;
    private readonly ILogger<NotificationOrchestrator> _logger = logger;
    private readonly NotificationDbContext _dbContext = dbContext;

    public async Task<bool> SendNotificationAsync(Notification notification)
    {
        try
        {
            // Check if we should send this notification
            if (!await ShouldSendNotificationAsync(notification.UserId, notification.Type, notification.Template))
            {
                await LogNotificationEventAsync(notification.Id, NotificationEventTypes.Cancelled, "User preferences prevent sending");
                return false;
            }

            bool success = false;
            var metadata = string.IsNullOrEmpty(notification.MetadataJson)
                ? new NotificationMetadata()
                : JsonSerializer.Deserialize<NotificationMetadata>(notification.MetadataJson) ?? new NotificationMetadata();

            switch (notification.Type.ToUpperInvariant())
            {
                case "EMAIL":
                    success = await _emailService.SendTemplatedEmailAsync(
                        notification.Recipient,
                        notification.Template,
                        metadata.Variables);
                    break;

                case "SMS":
                    success = await _smsService.SendTemplatedSmsAsync(
                        notification.Recipient,
                        notification.Template,
                        metadata.Variables);
                    break;

                case "PUSH":
                    var title = metadata.Variables.GetValueOrDefault("Title", "SkillSwap Notification");
                    var body = metadata.Variables.GetValueOrDefault("Body", notification.Content);
                    success = await _pushService.SendPushNotificationAsync(
                        notification.Recipient,
                        title,
                        body,
                        metadata.Variables);
                    break;

                default:
                    _logger.LogWarning("Unknown notification type: {Type}", notification.Type);
                    return false;
            }

            // Update notification status
            notification.Status = success ? NotificationStatus.Sent : NotificationStatus.Failed;
            notification.SentAt = success ? DateTime.UtcNow : null;
            notification.UpdatedAt = DateTime.UtcNow;

            if (!success)
            {
                notification.RetryCount++;
                notification.NextRetryAt = CalculateNextRetry(notification.RetryCount);
            }

            await _dbContext.SaveChangesAsync();

            // Log event
            var eventType = success ? NotificationEventTypes.Sent : NotificationEventTypes.Failed;
            await LogNotificationEventAsync(notification.Id, eventType);

            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending notification {NotificationId}", notification.Id);

            notification.Status = NotificationStatus.Failed;
            notification.ErrorMessage = ex.Message;
            notification.RetryCount++;
            notification.NextRetryAt = CalculateNextRetry(notification.RetryCount);
            notification.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();
            await LogNotificationEventAsync(notification.Id, NotificationEventTypes.Failed, ex.Message);

            return false;
        }
    }

    public async Task<bool> ShouldSendNotificationAsync(string userId, string type, string template)
    {
        try
        {
            var preferences = await _dbContext.NotificationPreferences
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (preferences == null)
            {
                // Default to allowing notifications if no preferences set
                return true;
            }

            // Check quiet hours
            if (IsInQuietHours(preferences))
            {
                return false;
            }

            // Check type-specific preferences
            return type.ToUpperInvariant() switch
            {
                "EMAIL" => IsEmailAllowed(preferences, template),
                "SMS" => IsSmsAllowed(preferences, template),
                "PUSH" => IsPushAllowed(preferences, template),
                _ => true
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking notification preferences for user {UserId}", userId);
            return true; // Default to allowing if check fails
        }
    }

    public async Task LogNotificationEventAsync(string notificationId, string eventType, string? details = null)
    {
        try
        {
            var notificationEvent = new NotificationEvent
            {
                NotificationId = notificationId,
                EventType = eventType,
                Details = details,
                Timestamp = DateTime.UtcNow
            };

            _dbContext.NotificationEvents.Add(notificationEvent);
            await _dbContext.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to log notification event {EventType} for notification {NotificationId}",
                eventType, notificationId);
        }
    }

    private static DateTime? CalculateNextRetry(int retryCount)
    {
        // Exponential backoff: 1min, 5min, 15min, 1hr, 6hr
        TimeSpan? delay = retryCount switch
        {
            1 => TimeSpan.FromMinutes(1),
            2 => TimeSpan.FromMinutes(5),
            3 => TimeSpan.FromMinutes(15),
            4 => TimeSpan.FromHours(1),
            5 => TimeSpan.FromHours(6),
            _ => null // No more retries after 5 attempts
        };

        return delay.HasValue ? DateTime.UtcNow.Add(delay.Value) : null;
    }

    private static bool IsInQuietHours(NotificationPreferences preferences)
    {
        if (!preferences.QuietHoursStart.HasValue || !preferences.QuietHoursEnd.HasValue)
            return false;

        var now = TimeOnly.FromDateTime(DateTime.UtcNow); // Should convert to user's timezone
        var start = preferences.QuietHoursStart.Value;
        var end = preferences.QuietHoursEnd.Value;

        if (start <= end)
        {
            return now >= start && now <= end;
        }
        else
        {
            // Quiet hours span midnight
            return now >= start || now <= end;
        }
    }

    private static bool IsEmailAllowed(NotificationPreferences preferences, string template)
    {
        if (!preferences.EmailEnabled) return false;

        return template switch
        {
            "security-alert" or "password-reset" or "email-verification" => preferences.EmailSecurity,
            "welcome" or "skill-match-found" => preferences.EmailUpdates,
            _ => preferences.EmailUpdates
        };
    }

    private static bool IsSmsAllowed(NotificationPreferences preferences, string template)
    {
        if (!preferences.SmsEnabled) return false;

        return template switch
        {
            "security-alert" or "password-reset" => preferences.SmsSecurity,
            "appointment-reminder" => preferences.SmsReminders,
            _ => false // Most SMS disabled by default
        };
    }

    private static bool IsPushAllowed(NotificationPreferences preferences, string template)
    {
        if (!preferences.PushEnabled) return false;

        return template switch
        {
            "security-alert" => preferences.PushSecurity,
            "skill-match-found" => preferences.PushUpdates,
            _ => preferences.PushUpdates
        };
    }
}
