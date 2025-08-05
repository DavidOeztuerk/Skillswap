using Contracts.Skill.Responses;

namespace Contracts.User.Responses;

/// <summary>
/// API response for GetFavoriteSkills operation
/// </summary>
public record GetFavoriteSkillsResponse(
    List<UserSkillResponse> FavoriteSkills)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
