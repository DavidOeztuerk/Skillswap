namespace Contracts.Skill.Responses;

/// <summary>
/// API response for successful skill creation
/// </summary>
/// <param name="SkillId">Unique identifier for the created skill</param>
/// <param name="Name">Name of the skill</param>
/// <param name="Description">Detailed description of the skill</param>
/// <param name="CategoryId">ID of the skill category</param>
/// <param name="Tags">Associated tags for the skill</param>
/// <param name="IsOffered">Whether the user offers this skill (true) or seeks to learn it (false)</param>
/// <param name="Status">Current status of the skill</param>
/// <param name="CreatedAt">When the skill was created</param>
public record CreateSkillResponse(
    string SkillId,
    string Name,
    string Description,
    string CategoryId,
    List<string> Tags,
    bool IsOffered,
    string Status,
    DateTime CreatedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}