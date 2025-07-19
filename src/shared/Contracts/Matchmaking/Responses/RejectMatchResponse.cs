namespace Contracts.Matchmaking.Responses;

/// <summary>
/// API response for RejectMatch operation
/// </summary>
public record RejectMatchResponse(
    string MatchId,
    bool Success,
    DateTime RejectedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
