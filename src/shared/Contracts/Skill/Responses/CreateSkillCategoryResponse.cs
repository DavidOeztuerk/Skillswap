namespace Contracts.Skill.Responses;

/// <summary>
/// API response for CreateSkillCategory operation
/// </summary>
public record CreateSkillCategoryResponse(
    string CategoryId,
    string Name,
    string? IconName,
    string? Color,
    DateTime CreatedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
