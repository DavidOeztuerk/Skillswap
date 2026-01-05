namespace Contracts.Skill.Responses;

/// <summary>
/// API response for RemoveFavorite operation
/// </summary>
public record RemoveFavoriteResponse(
    string SkillId,
    bool Success)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
