using System.ComponentModel.DataAnnotations;

namespace Contracts.Skill.Requests;

/// <summary>
/// API request for endorsing a skill
/// </summary>
/// <param name="EndorsedUserId">User who owns the skill being endorsed</param>
/// <param name="Comment">Optional endorsement message</param>
public record EndorseSkillRequest(
    string SkillId,
    [Required(ErrorMessage = "Endorsed user ID is required")]
    string EndorsedUserId,
    
    [StringLength(500, ErrorMessage = "Comment must not exceed 500 characters")]
    string? Comment = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
