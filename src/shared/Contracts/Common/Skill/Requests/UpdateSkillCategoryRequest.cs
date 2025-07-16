using System.ComponentModel.DataAnnotations;

namespace Contracts.Skill.Requests;

/// <summary>
/// API request for updating an existing skill category
/// </summary>
/// <param name="CategoryId">The ID of the skill category to update</param>
/// <param name="Name">Updated name of the skill category</param>
/// <param name="Description">Updated description of the skill category</param>
/// <param name="IconName">Updated icon name for the skill category</param>
/// <param name="Color">Updated color code for the skill category (hex format)</param>
/// <param name="SortOrder">Updated sort order for displaying the category</param>
/// <param name="IsActive">Whether the category is active</param>
public record UpdateSkillCategoryRequest(
    [Required(ErrorMessage = "Category ID is required")]
    string CategoryId,

    [StringLength(50, MinimumLength = 2, ErrorMessage = "Category name must be between 2 and 50 characters")]
    string? Name = null,

    [StringLength(500, ErrorMessage = "Description must not exceed 500 characters")]
    string? Description = null,

    [StringLength(50, ErrorMessage = "Icon name must not exceed 50 characters")]
    string? IconName = null,

    [RegularExpression(@"^#[0-9A-Fa-f]{6}$", ErrorMessage = "Color must be a valid hex color code")]
    string? Color = null,

    [Range(0, int.MaxValue, ErrorMessage = "Sort order must be non-negative")]
    int? SortOrder = null,

    bool? IsActive = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
