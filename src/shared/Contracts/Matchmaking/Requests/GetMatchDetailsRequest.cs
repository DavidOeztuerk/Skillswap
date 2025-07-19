namespace Contracts.Matchmaking.Requests;

/// <summary>
/// API request for GetMatchDetails operation
/// </summary>
public record GetMatchDetailsRequest(string MatchId)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
