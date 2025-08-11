using System.ComponentModel.DataAnnotations;
using Contracts.Common;

namespace Contracts.Skill.Requests;

/// <summary>
/// API request for creating a new skill
/// </summary>
/// <param name="Name">Name of the skill</param>
/// <param name="Description">Detailed description of the skill</param>
/// <param name="CategoryId">Skill category identifier</param>
/// <param name="ProficiencyLevelId">Proficiency level identifier</param>
/// <param name="Tags">Associated tags for the skill</param>
/// <param name="IsOffered">Whether the user offers this skill (true) or seeks to learn it (false)</param>
/// <param name="AvailableHours">Available hours per week for this skill</param>
/// <param name="PreferredSessionDuration">Preferred session duration in minutes</param>
public record CreateSkillRequest(
    [Required(ErrorMessage = "Skill name is required")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Skill name must be between 2 and 100 characters")]
    string Name,

    [Required(ErrorMessage = "Description is required")]
    [StringLength(1000, MinimumLength = 10, ErrorMessage = "Description must be between 10 and 1000 characters")]
    string Description,

    [Required(ErrorMessage = "Category ID is required")]
    string CategoryId,

    [Required(ErrorMessage = "Proficiency level ID is required")]
    string ProficiencyLevelId,

    List<string> Tags,

    [Required(ErrorMessage = "Must specify if skill is offered")]
    bool IsOffered,

    [Range(1, 40, ErrorMessage = "Available hours must be between 1 and 40 per week")]
    int? AvailableHours = null,

    [Range(15, 480, ErrorMessage = "Session duration must be between 15 and 480 minutes")]
    int? PreferredSessionDuration = 60)
    : IVersionedContract
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}