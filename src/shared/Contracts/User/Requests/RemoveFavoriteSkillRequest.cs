namespace Contracts.User.Requests;

/// <summary>
/// API request for RemoveFavoriteSkill operation
/// </summary>
public record RemoveFavoriteSkillRequest(
    string SkillId)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
