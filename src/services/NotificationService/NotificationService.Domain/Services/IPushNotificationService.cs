namespace NotificationService.Domain.Services;

/// <summary>
/// Push notification service interface for sending push notifications
/// </summary>
public interface IPushNotificationService
{
    Task<bool> SendPushNotificationAsync(string deviceToken, string title, string body, Dictionary<string, string>? data = null);
    Task<bool> SendTopicNotificationAsync(string topic, string title, string body, Dictionary<string, string>? data = null);
}
