using System.ComponentModel.DataAnnotations;

namespace Contracts.Skill.Requests;

/// <summary>
/// API request for deleting a skill
/// </summary>
/// <param name="SkillId">ID of the skill to delete</param>
/// <param name="Reason">Optional reason for deletion</param>
public record DeleteSkillRequest(
    [Required(ErrorMessage = "Skill ID is required")]
    string SkillId,
    
    [StringLength(500, ErrorMessage = "Reason must not exceed 500 characters")]
    string? Reason = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
