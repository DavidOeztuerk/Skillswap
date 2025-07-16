namespace Contracts.Notification.Responses;

/// <summary>
/// API response for GetNotificationStatistics operation
/// </summary>
public record GetNotificationStatisticsResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
