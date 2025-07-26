namespace Contracts.Matchmaking.Responses;

/// <summary>
/// API response for AcceptMatchRequest operation
/// </summary>
public record AcceptMatchRequestResponse(
    string RequestId,
    string MatchId,
    DateTime AcceptedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
