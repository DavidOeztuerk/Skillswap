using System.ComponentModel.DataAnnotations;

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
/// <param name="IsOffered">Updated: whether the user offers this skill</param>
/// <param name="IsWanted">Updated: whether the user wants to learn this skill</param>
/// <param name="AvailableHours">Updated available hours per week for this skill</param>
/// <param name="PreferredSessionDuration">Updated preferred session duration in minutes</param>
/// <param name="Location">Updated preferred location for skill exchange</param>
/// <param name="IsRemote">Updated: whether remote sessions are acceptable</param>
public record UpdateSkillRequest(
    [Required(ErrorMessage = "Skill ID is required")]
    string SkillId,

    [StringLength(100, MinimumLength = 2, ErrorMessage = "Skill name must be between 2 and 100 characters")]
    string? Name = null,

    [StringLength(1000, MinimumLength = 10, ErrorMessage = "Description must be between 10 and 1000 characters")]
    string? Description = null,

    string? CategoryId = null,

    string? ProficiencyLevelId = null,

    List<string>? Tags = null,

    bool? IsOffered = null,

    bool? IsWanted = null,

    [Range(1, 40, ErrorMessage = "Available hours must be between 1 and 40 per week")]
    int? AvailableHours = null,

    [Range(15, 480, ErrorMessage = "Session duration must be between 15 and 480 minutes")]
    int? PreferredSessionDuration = null,

    [StringLength(200, ErrorMessage = "Location must not exceed 200 characters")]
    string? Location = null,

    bool? IsRemote = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}