namespace Contracts.User.Responses;

/// <summary>
/// API response for AddFavoriteSkill operation
/// </summary>
public record AddFavoriteSkillResponse(
    string UserId,
    string SkillId,
    bool Success)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
