using System.ComponentModel.DataAnnotations;
using Contracts.Common;

namespace Contracts.Skill.Requests;

/// <summary>
/// API request for updating an existing skill
/// </summary>
/// <param name="SkillId">ID of the skill to update</param>
/// <param name="Name">Updated name of the skill</param>
/// <param name="Description">Updated description of the skill</param>
/// <param name="CategoryId">Updated skill category identifier</param>
/// <param name="ProficiencyLevelId">Updated proficiency level identifier</param>
/// <param name="Tags">Updated associated tags for the skill</param>
/// <param name="IsOffered">Whether the user offers this skill (true) or seeks to learn it (false)</param>
/// <param name="AvailableHours">Updated available hours per week for this skill</param>
/// <param name="PreferredSessionDuration">Updated preferred session duration in minutes</param>
public record UpdateSkillRequest(
    [Required(ErrorMessage = "Skill ID is required")]
    string SkillId,

    [StringLength(100, MinimumLength = 2, ErrorMessage = "Skill name must be between 2 and 100 characters")]
    string Name,

    [StringLength(1000, MinimumLength = 10, ErrorMessage = "Description must be between 10 and 1000 characters")]
    string Description,

    string CategoryId,

    string ProficiencyLevelId,

    List<string> Tags,

    bool IsOffered,

    [Range(1, 40, ErrorMessage = "Available hours must be between 1 and 40 per week")]
    int? AvailableHours = null,

    [Range(15, 480, ErrorMessage = "Session duration must be between 15 and 480 minutes")]
    int? PreferredSessionDuration = null)
    : IVersionedContract
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}