using System.ComponentModel.DataAnnotations;

namespace Contracts.Matchmaking.Requests;

/// <summary>
/// API request for CreateMatchRequest operation
/// </summary>
public record CreateMatchRequestRequest(
    string SkillId,
    string Description,
    string Messagm)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
