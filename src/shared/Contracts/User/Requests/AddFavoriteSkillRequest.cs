using Contracts.Common;

namespace Contracts.User.Requests;

/// <summary>
/// API request for AddFavoriteSkill operation
/// </summary>
public record AddFavoriteSkillRequest(
    string SkillId)
    : IVersionedContract
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
