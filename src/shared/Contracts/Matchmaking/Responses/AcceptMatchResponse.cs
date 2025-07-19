namespace Contracts.Matchmaking.Responses;

/// <summary>
/// API response for AcceptMatch operation
/// </summary>
public record AcceptMatchResponse(
    string MatchId,
    string Status,
    DateTime AcceptedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
