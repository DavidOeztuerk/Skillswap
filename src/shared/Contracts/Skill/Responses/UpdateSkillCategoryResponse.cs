namespace Contracts.Skill.Responses;

/// <summary>
/// API response for UpdateSkillCategory operation
/// </summary>
public record UpdateSkillCategoryResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
