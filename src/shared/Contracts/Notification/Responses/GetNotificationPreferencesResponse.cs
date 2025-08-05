namespace Contracts.Notification.Responses;

/// <summary>
/// API response for GetNotificationPreferences operation
/// </summary>
public record GetNotificationPreferencesResponse(
    string UserId,
    EmailNotificationPreferences EmailSettings,
    SmsNotificationPreferences SmsSettings,
    PushNotificationPreferences PushSettings,
    string TimeZone,
    string DigestFrequency,
    string Language)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

public record EmailNotificationPreferences(
    bool Enabled,
    bool Marketing,
    bool Security,
    bool Updates);

public record SmsNotificationPreferences(
    bool Enabled,
    bool Security,
    bool Reminders);

public record PushNotificationPreferences(
    bool Enabled,
    bool Marketing,
    bool Security,
    bool Updates);
