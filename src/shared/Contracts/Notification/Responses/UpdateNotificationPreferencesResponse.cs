namespace Contracts.Notification.Responses;

/// <summary>
/// API response for UpdateNotificationPreferences operation
/// </summary>
public record UpdateNotificationPreferencesResponse(
    string UserId,
    //EmailNotificationSettings EmailSettings,
    //PushNotificationSettings PushSettings,
    //InAppNotificationSettings InAppSettings,
    DateTime UpdatedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
