using System.ComponentModel.DataAnnotations;

namespace Contracts.Matchmaking.Requests;

/// <summary>
/// API request for AcceptMatch operation
/// </summary>
public record AcceptMatchRequest(
   string MatchId)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
