namespace Contracts.Notification.Responses;

/// <summary>
/// API response for MarkNotificationAsRead operation
/// </summary>
public record MarkNotificationAsReadResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
