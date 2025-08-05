namespace Contracts.Notification.Responses;

/// <summary>
/// API response for GetNotificationStatistics operation
/// </summary>
public record GetNotificationStatisticsResponse(
    int TotalSent,
    int TotalDelivered,
    int TotalFailed,
    double DeliveryRate,
    double OpenRate,
    Dictionary<string, int> SentByType,
    Dictionary<string, int> FailedByType,
    DateTime StartDate,
    DateTime EndDate)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
