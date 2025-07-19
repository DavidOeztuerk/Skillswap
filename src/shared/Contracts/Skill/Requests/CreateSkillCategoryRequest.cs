using System.ComponentModel.DataAnnotations;

namespace Contracts.Skill.Requests;

/// <summary>
/// API request for creating a new skill category
/// </summary>
/// <param name="Name">Name of the skill category</param>
/// <param name="Description">Description of the skill category</param>
/// <param name="IconName">Icon name for the skill category</param>
/// <param name="Color">Color code for the skill category (hex format)</param>
/// <param name="SortOrder">Sort order for displaying the category</param>
/// <param name="IsActive">Whether the category is active</param>
public record CreateSkillCategoryRequest(
    [Required(ErrorMessage = "Category name is required")]
    [StringLength(50, MinimumLength = 2, ErrorMessage = "Category name must be between 2 and 50 characters")]
    [RegularExpression(@"^[a-zA-Z0-9\s\-\&]+$", ErrorMessage = "Category name contains invalid characters")]
    string Name,

    [StringLength(500, ErrorMessage = "Description must not exceed 500 characters")]
    string? Description = null,

    [StringLength(50, ErrorMessage = "Icon name must not exceed 50 characters")]
    string? IconName = null,

    [RegularExpression(@"^#[0-9A-Fa-f]{6}$", ErrorMessage = "Color must be a valid hex color code")]
    string? Color = null,

    [Range(0, int.MaxValue, ErrorMessage = "Sort order must be non-negative")]
    int SortOrder = 0,

    bool IsActive = true)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
