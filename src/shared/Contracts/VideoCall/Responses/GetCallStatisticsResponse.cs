namespace Contracts.VideoCall.Responses;

/// <summary>
/// API response for GetCallStatistics operation
/// </summary>
public record GetCallStatisticsResponse(
    int TotalCalls,
    int CompletedCalls,
    int CancelledCalls,
    double AverageDurationMinutes,
    double CompletionRate,
    int TotalParticipants,
    int UniqueUsers,
    Dictionary<string, int> CallsByHour,
    List<CallQualityMetricResponse> QualityMetrics)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

/// <summary>
/// Quality metric for call statistics
/// </summary>
public record CallQualityMetricResponse(
    string MetricName,
    double Value,
    string Unit);
