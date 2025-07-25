namespace Contracts.VideoCall.Responses;

/// <summary>
/// API response for GetUserCallHistory operation
/// </summary>
public record GetUserCallHistoryResponse(
    List<CallSessionSummary> Sessions,
    int TotalCount,
    int PageNumber,
    int PageSize)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

public record CallSessionSummary(
    string SessionId,
    DateTime StartedAt,
    int DurationSeconds,
    int? Rating);
