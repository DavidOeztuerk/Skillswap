using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Services;
using NotificationService.Infrastructure.Data;
using NotificationService.Hubs;
using System.Text.Json;

namespace NotificationService.Infrastructure.Services;

public class NotificationOrchestrator(
    IEmailService emailService,
    ISmsService smsService,
    IPushNotificationService pushService,
    ILogger<NotificationOrchestrator> logger,
    IServiceScopeFactory serviceScopeFactory,
    IHubContext<NotificationHub> hubContext,
    IUserServiceClient userServiceClient)
    : INotificationOrchestrator
{
    private readonly IEmailService _emailService = emailService;
    private readonly ISmsService _smsService = smsService;
    private readonly IPushNotificationService _pushService = pushService;
    private readonly ILogger<NotificationOrchestrator> _logger = logger;
    private readonly IServiceScopeFactory _serviceScopeFactory = serviceScopeFactory;
    private readonly IHubContext<NotificationHub> _hubContext = hubContext;
    private readonly IUserServiceClient _userServiceClient = userServiceClient;

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
                    // If notification has direct content, use it instead of template
                    if (!string.IsNullOrEmpty(notification.Content) && !string.IsNullOrEmpty(notification.Subject))
                    {
                        _logger.LogDebug("Sending direct email to {Recipient}, Subject: {Subject}",
                            notification.Recipient, notification.Subject);
                        success = await _emailService.SendEmailAsync(
                            notification.Recipient,
                            notification.Subject,
                            notification.Content,
                            notification.Content);
                    }
                    else
                    {
                        success = await _emailService.SendTemplatedEmailAsync(
                            notification.Recipient,
                            notification.Template,
                            metadata.Variables);
                    }
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

            // Update notification status in a new scope
            using (var scope = _serviceScopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();

                // Re-attach notification to the new context
                var trackedNotification = await dbContext.Notifications.FindAsync(notification.Id);
                if (trackedNotification != null)
                {
                    trackedNotification.Status = success ? NotificationStatus.Sent : NotificationStatus.Failed;
                    trackedNotification.SentAt = success ? DateTime.UtcNow : null;
                    trackedNotification.UpdatedAt = DateTime.UtcNow;

                    if (!success)
                    {
                        trackedNotification.RetryCount++;
                        trackedNotification.NextRetryAt = CalculateNextRetry(trackedNotification.RetryCount);
                    }

                    await dbContext.SaveChangesAsync();
                }
            }

            // Log event
            var eventType = success ? NotificationEventTypes.Sent : NotificationEventTypes.Failed;
            await LogNotificationEventAsync(notification.Id, eventType);

            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending notification {NotificationId}", notification.Id);

            // Update error status in a new scope
            using (var scope = _serviceScopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();

                var trackedNotification = await dbContext.Notifications.FindAsync(notification.Id);
                if (trackedNotification != null)
                {
                    trackedNotification.Status = NotificationStatus.Failed;
                    trackedNotification.ErrorMessage = ex.Message;
                    trackedNotification.RetryCount++;
                    trackedNotification.NextRetryAt = CalculateNextRetry(trackedNotification.RetryCount);
                    trackedNotification.UpdatedAt = DateTime.UtcNow;

                    await dbContext.SaveChangesAsync();
                }
            }

            await LogNotificationEventAsync(notification.Id, NotificationEventTypes.Failed, ex.Message);

            return false;
        }
    }

    public async Task<bool> ShouldSendNotificationAsync(string userId, string type, string template)
    {
        try
        {
            using (var scope = _serviceScopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();

                var preferences = await dbContext.NotificationPreferences
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
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking notification preferences for user {UserId}", userId);
            return true; // Default to allowing if check fails
        }
    }

    public async Task<bool> SendImmediateNotificationAsync(
        string userId,
        string type,
        string template,
        string recipient,
        Dictionary<string, string> variables,
        string priority = "Normal")
    {
        try
        {
            _logger.LogInformation("Sending immediate {Type} notification to {Recipient}", type, recipient);
            
            // Check user preferences first
            if (!await ShouldSendNotificationAsync(userId, type, template))
            {
                _logger.LogInformation("Notification blocked by user preferences for user {UserId}", userId);
                return false;
            }
            
            // Send directly based on type
            bool success = false;
            switch (type.ToUpperInvariant())
            {
                case "EMAIL":
                    success = await _emailService.SendTemplatedEmailAsync(recipient, template, variables);
                    break;
                    
                case "SMS":
                    success = await _smsService.SendTemplatedSmsAsync(recipient, template, variables);
                    break;
                    
                case "PUSH":
                    var title = variables.GetValueOrDefault("Title", "SkillSwap Notification");
                    var body = variables.GetValueOrDefault("Body", "You have a new notification");
                    success = await _pushService.SendPushNotificationAsync(recipient, title, body, variables);
                    break;
                    
                default:
                    _logger.LogWarning("Unknown notification type: {Type}", type);
                    return false;
            }
            
            // Optionally log to database for audit trail (but don't require it for success)
            try
            {
                var notification = new Notification
                {
                    Id = Guid.NewGuid().ToString(),
                    UserId = userId,
                    Type = type,
                    Template = template,
                    Recipient = recipient,
                    Subject = variables.GetValueOrDefault("Subject", template),
                    Content = "Immediate notification sent",
                    MetadataJson = JsonSerializer.Serialize(new NotificationMetadata { Variables = variables }),
                    Status = success ? NotificationStatus.Sent : NotificationStatus.Failed,
                    Priority = priority,
                    SentAt = success ? DateTime.UtcNow : null,
                    CreatedAt = DateTime.UtcNow
                };

                using (var scope = _serviceScopeFactory.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();
                    dbContext.Notifications.Add(notification);
                    await dbContext.SaveChangesAsync();
                }

                await LogNotificationEventAsync(notification.Id, success ? NotificationEventTypes.Sent : NotificationEventTypes.Failed);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to log immediate notification to database, but notification was sent");
            }
            
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send immediate notification");
            return false;
        }
    }
    
    public async Task<bool> SendNotificationAsync(
        string recipientUserId,
        string type,
        string title,
        string message,
        string priority = "Normal",
        Dictionary<string, object>? metadata = null)
    {
        try
        {
            // Resolve email address from UserService
            string recipient = recipientUserId;
            if (type.Equals("EMAIL", StringComparison.OrdinalIgnoreCase))
            {
                var contactInfo = await _userServiceClient.GetUserContactInfoAsync(
                    new List<string> { recipientUserId },
                    CancellationToken.None);

                var userEmail = contactInfo.FirstOrDefault()?.Email;
                if (string.IsNullOrEmpty(userEmail))
                {
                    _logger.LogWarning("Could not resolve email for user {UserId}, cannot send email notification", recipientUserId);
                    return false;
                }
                recipient = userEmail;
                _logger.LogDebug("Resolved email {Email} for user {UserId}", userEmail, recipientUserId);
            }

            // Create and save notification
            var notification = new Notification
            {
                UserId = recipientUserId,
                Type = type,
                Template = type.ToLower().Replace(" ", "_"),
                Recipient = recipient, // Now resolved to actual email for EMAIL type
                Subject = title,
                Content = message,
                Priority = priority,
                Status = "Pending",
                MetadataJson = metadata != null ? JsonSerializer.Serialize(metadata) : null,
                CreatedAt = DateTime.UtcNow,
                ScheduledAt = DateTime.UtcNow
            };

            using (var scope = _serviceScopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();
                dbContext.Notifications.Add(notification);
                await dbContext.SaveChangesAsync();
            }

            // Send the notification
            return await SendNotificationAsync(notification);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send notification to user {UserId}", recipientUserId);
            return false;
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

            using (var scope = _serviceScopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();
                dbContext.NotificationEvents.Add(notificationEvent);
                await dbContext.SaveChangesAsync();
            }
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
    
    public async Task<bool> ScheduleNotificationAsync(
        string userId,
        string type,
        string template,
        string recipient,
        Dictionary<string, string> variables,
        DateTime scheduledFor,
        string priority = "Normal")
    {
        try
        {
            // Create notification with scheduled time
            var notification = new Notification
            {
                Id = Guid.NewGuid().ToString(),
                UserId = userId,
                Type = type,
                Template = template,
                Recipient = recipient,
                Variables = System.Text.Json.JsonSerializer.Serialize(variables),
                Priority = priority,
                Status = NotificationStatus.Scheduled,
                ScheduledAt = scheduledFor,
                CreatedAt = DateTime.UtcNow
            };
            
            // Save to database
            using (var scope = _serviceScopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();
                dbContext.Notifications.Add(notification);
                await dbContext.SaveChangesAsync();
            }

            _logger.LogInformation(
                "Scheduled notification {NotificationId} for user {UserId} at {ScheduledTime}",
                notification.Id, userId, scheduledFor);
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to schedule notification for user {UserId}",
                userId);
            return false;
        }
    }
    
    public async Task<bool> AddToDigestAsync(
        string userId,
        string template,
        Dictionary<string, string> variables)
    {
        try
        {
            // Create digest entry
            var digestEntry = new NotificationDigestEntry
            {
                Id = Guid.NewGuid().ToString(),
                UserId = userId,
                Template = template,
                Variables = System.Text.Json.JsonSerializer.Serialize(variables),
                CreatedAt = DateTime.UtcNow,
                IsProcessed = false
            };
            
            // Save to database
            using (var scope = _serviceScopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();
                dbContext.NotificationDigestEntries.Add(digestEntry);
                await dbContext.SaveChangesAsync();
            }
            
            _logger.LogInformation(
                "Added notification to digest for user {UserId}, template {Template}",
                userId, template);
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to add notification to digest for user {UserId}",
                userId);
            return false;
        }
    }
}
