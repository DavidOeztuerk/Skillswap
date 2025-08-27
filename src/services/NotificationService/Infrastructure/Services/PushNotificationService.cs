using FirebaseAdmin;
using FirebaseAdmin.Messaging;

namespace NotificationService.Infrastructure.Services;

public class PushNotificationService : IPushNotificationService
{
    private readonly ILogger<PushNotificationService> _logger;
    private readonly FirebaseMessaging? _messaging;

    public PushNotificationService(ILogger<PushNotificationService> logger)
    {
        _logger = logger;

        try
        {
            // Initialize Firebase Admin SDK
            if (FirebaseApp.DefaultInstance == null)
            {
                FirebaseApp.Create();
            }
            _messaging = FirebaseMessaging.DefaultInstance;
            _logger.LogInformation("Firebase initialized successfully");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Firebase initialization failed. Push notifications will be disabled");
            _messaging = null;
        }
    }

    public async Task<bool> SendPushNotificationAsync(string deviceToken, string title, string body, Dictionary<string, string>? data = null)
    {
        if (_messaging == null)
        {
            _logger.LogDebug("Push notification skipped - Firebase not configured");
            return false;
        }

        try
        {
            var message = new Message()
            {
                Token = deviceToken,
                Notification = new Notification()
                {
                    Title = title,
                    Body = body
                },
                Data = data ?? []
            };

            var response = await _messaging.SendAsync(message);

            _logger.LogInformation("Push notification sent successfully, MessageId: {MessageId}", response);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send push notification to {DeviceToken}", deviceToken);
            return false;
        }
    }

    public async Task<bool> SendTopicNotificationAsync(string topic, string title, string body, Dictionary<string, string>? data = null)
    {
        try
        {
            var message = new Message()
            {
                Topic = topic,
                Notification = new Notification()
                {
                    Title = title,
                    Body = body
                },
                Data = data ?? []
            };

            var response = await _messaging.SendAsync(message);

            _logger.LogInformation("Topic notification sent successfully to {Topic}, MessageId: {MessageId}", topic, response);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send topic notification to {Topic}", topic);
            return false;
        }
    }
}
