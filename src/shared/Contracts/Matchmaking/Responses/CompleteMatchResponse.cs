namespace Contracts.Matchmaking.Responses;

/// <summary>
/// API response for CompleteMatch operation
/// </summary>
public record CompleteMatchResponse(
    string MatchId,
    bool Success,
    DateTime CompletedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
