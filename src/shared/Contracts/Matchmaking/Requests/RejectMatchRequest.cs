namespace Contracts.Matchmaking.Requests;

/// <summary>
/// API request for RejectMatch operation
/// </summary>
public record RejectMatchRequest(
    string MatchId,
    string? Reason = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
