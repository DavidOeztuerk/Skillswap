namespace Contracts.Skill.Responses;

/// <summary>
/// API response for CreateSkillCategory operation
/// </summary>
public record CreateSkillCategoryResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
