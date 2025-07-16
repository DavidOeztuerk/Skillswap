namespace Contracts.Notification.Responses;

/// <summary>
/// API response for SendNotification operation
/// </summary>
public record SendNotificationResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
