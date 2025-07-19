namespace Contracts.Notification.Responses;

/// <summary>
/// API response for GetNotificationPreferences operation
/// </summary>
public record GetNotificationPreferencesResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
