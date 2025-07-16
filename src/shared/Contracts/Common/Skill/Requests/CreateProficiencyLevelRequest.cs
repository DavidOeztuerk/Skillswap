using System.ComponentModel.DataAnnotations;

namespace Contracts.Skill.Requests;

/// <summary>
/// API request for creating a new proficiency level
/// </summary>
/// <param name="Level">Name of the proficiency level</param>
/// <param name="Description">Description of the proficiency level</param>
/// <param name="Rank">Rank of the proficiency level (1-10)</param>
/// <param name="Color">Color code for the proficiency level (hex format)</param>
/// <param name="IsActive">Whether the proficiency level is active</param>
public record CreateProficiencyLevelRequest(
    [Required(ErrorMessage = "Level name is required")]
    [StringLength(30, MinimumLength = 2, ErrorMessage = "Level name must be between 2 and 30 characters")]
    [RegularExpression(@"^[a-zA-Z\s\-]+$", ErrorMessage = "Level name contains invalid characters")]
    string Level,

    [StringLength(500, ErrorMessage = "Description must not exceed 500 characters")]
    string? Description = null,

    [Range(1, 10, ErrorMessage = "Rank must be between 1 and 10")]
    int Rank = 1,

    [RegularExpression(@"^#[0-9A-Fa-f]{6}$", ErrorMessage = "Color must be a valid hex color code")]
    string? Color = null,

    bool IsActive = true)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
