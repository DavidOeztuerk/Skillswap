namespace Contracts.Skill.Responses;

/// <summary>
/// API response for IsFavorite query
/// </summary>
public record IsFavoriteResponse(
    string SkillId,
    bool IsFavorite)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
