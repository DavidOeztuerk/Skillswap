namespace Contracts.VideoCall.Responses;

/// <summary>
/// API response for GetCallStatistics operation
/// </summary>
public record GetCallStatisticsResponse(
    int TotalCalls,
    int ActiveCalls,
    double AverageDurationSeconds)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
