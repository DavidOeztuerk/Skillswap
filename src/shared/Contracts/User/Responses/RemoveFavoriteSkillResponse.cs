namespace Contracts.User.Responses;

/// <summary>
/// API response for RemoveFavoriteSkill operation
/// </summary>
public record RemoveFavoriteSkillResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
