namespace Contracts.Matchmaking.Requests;

/// <summary>
/// API request for GetMatchStatistics operation
/// </summary>
public record GetMatchStatisticsRequest(
    DateTime? FromDate = null,
    DateTime? ToDate = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
