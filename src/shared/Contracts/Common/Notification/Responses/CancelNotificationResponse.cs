namespace Contracts.Notification.Responses;

/// <summary>
/// API response for CancelNotification operation
/// </summary>
public record CancelNotificationResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
