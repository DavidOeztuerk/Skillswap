namespace Contracts.Skill.Responses;

/// <summary>
/// API response for UpdateSkillCategory operation
/// </summary>
public record UpdateSkillCategoryResponse(
    string CategoryId,
    string Name,
    DateTime UpdatedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
