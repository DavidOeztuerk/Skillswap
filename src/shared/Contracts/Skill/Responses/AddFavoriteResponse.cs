namespace Contracts.Skill.Responses;

/// <summary>
/// API response for AddFavorite operation
/// </summary>
public record AddFavoriteResponse(
    string FavoriteId,
    string SkillId,
    DateTime CreatedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
