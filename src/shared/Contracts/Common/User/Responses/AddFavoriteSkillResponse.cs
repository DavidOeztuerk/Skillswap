namespace Contracts.User.Responses;

/// <summary>
/// API response for AddFavoriteSkill operation
/// </summary>
public record AddFavoriteSkillResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
