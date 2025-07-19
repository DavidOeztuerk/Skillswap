namespace Contracts.Skill.Responses;

/// <summary>
/// API response for successful skill update
/// </summary>
/// <param name="SkillId">Unique identifier for the updated skill</param>
/// <param name="Name">Updated name of the skill</param>
/// <param name="Description">Updated detailed description of the skill</param>
/// <param name="CategoryName">Updated name of the skill category</param>
/// <param name="ProficiencyLevelName">Updated name of the proficiency level</param>
/// <param name="Tags">Updated associated tags for the skill</param>
/// <param name="IsOffered">Updated: whether the user offers this skill</param>
/// <param name="IsWanted">Updated: whether the user wants to learn this skill</param>
/// <param name="Status">Current status of the skill</param>
/// <param name="UpdatedAt">When the skill was last updated</param>
public record UpdateSkillResponse(
    string SkillId,
    string Name,
    string Description,
    string CategoryName,
    string ProficiencyLevelName,
    List<string> Tags,
    bool IsOffered,
    bool IsWanted,
    string Status,
    DateTime UpdatedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
