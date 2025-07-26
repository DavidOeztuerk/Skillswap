namespace Contracts.User.Requests;

/// <summary>
/// API request for GetFavoriteSkills operation
/// </summary>
public record GetFavoriteSkillsRequest(
    string PageSize,
    string PageNumber)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
