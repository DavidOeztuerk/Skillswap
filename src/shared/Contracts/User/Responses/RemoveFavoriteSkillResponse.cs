namespace Contracts.User.Responses;

/// <summary>
/// API response for RemoveFavoriteSkill operation
/// </summary>
public record RemoveFavoriteSkillResponse(
    string UserId,
    string SkillId,
    bool Success)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
