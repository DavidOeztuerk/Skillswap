using NotificationService.Domain.Entities;

namespace NotificationService.Infrastructure.Services;

/// <summary>
/// Orchestrates notification sending across different channels with retry logic and user preferences
/// </summary>
public interface INotificationOrchestrator
{
    /// <summary>
    /// Sends a notification that's already in the database
    /// </summary>
    Task<bool> SendNotificationAsync(Notification notification);
    
    /// <summary>
    /// Sends an immediate notification without saving to database first
    /// Used for time-critical notifications like email verification
    /// </summary>
    Task<bool> SendImmediateNotificationAsync(
        string userId,
        string type,
        string template,
        string recipient,
        Dictionary<string, string> variables,
        string priority = "Normal");
    
    /// <summary>
    /// Schedules a notification for future delivery
    /// </summary>
    Task<bool> ScheduleNotificationAsync(
        string userId,
        string type,
        string template,
        string recipient,
        Dictionary<string, string> variables,
        DateTime scheduledFor,
        string priority = "Normal");
    
    /// <summary>
    /// Adds a notification to the user's digest
    /// </summary>
    Task<bool> AddToDigestAsync(
        string userId,
        string template,
        Dictionary<string, string> variables);
    
    /// <summary>
    /// Checks if a notification should be sent based on user preferences
    /// </summary>
    Task<bool> ShouldSendNotificationAsync(string userId, string type, string template);
    
    /// <summary>
    /// Logs notification events for auditing
    /// </summary>
    Task LogNotificationEventAsync(string notificationId, string eventType, string? details = null);
    
    /// <summary>
    /// Sends a notification with detailed parameters (legacy support)
    /// </summary>
    Task<bool> SendNotificationAsync(
        string recipientUserId,
        string type,
        string title,
        string message,
        string priority = "Normal",
        Dictionary<string, object>? metadata = null);
}
