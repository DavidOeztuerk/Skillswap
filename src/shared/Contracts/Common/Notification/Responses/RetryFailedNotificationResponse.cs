namespace Contracts.Notification.Responses;

/// <summary>
/// API response for RetryFailedNotification operation
/// </summary>
public record RetryFailedNotificationResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
