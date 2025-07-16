namespace Contracts.User.Responses;

/// <summary>
/// API response for GetFavoriteSkills operation
/// </summary>
public record GetFavoriteSkillsResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
