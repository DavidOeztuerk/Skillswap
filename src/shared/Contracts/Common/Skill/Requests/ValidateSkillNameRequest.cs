using System.ComponentModel.DataAnnotations;

namespace Contracts.Skill.Requests;

/// <summary>
/// API request for validating skill name availability and suggesting alternatives
/// </summary>
/// <param name="Name">The skill name to validate</param>
/// <param name="ExcludeSkillId">Skill ID to exclude from validation (for updates)</param>
public record ValidateSkillNameRequest(
    [Required(ErrorMessage = "Skill name is required")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "Skill name must be between 3 and 100 characters")]
    string Name,
    
    string? ExcludeSkillId = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
