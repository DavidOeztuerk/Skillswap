using System.ComponentModel.DataAnnotations;

namespace Contracts.Skill.Requests;

/// <summary>
/// API request for bulk updating multiple skills
/// </summary>
/// <param name="SkillIds">List of skill IDs to update</param>
/// <param name="UpdateData">Data to update for the skills</param>
public record BulkUpdateSkillsRequest(
    [Required(ErrorMessage = "Skill IDs are required")]
    [MinLength(1, ErrorMessage = "At least one skill ID is required")]
    [MaxLength(100, ErrorMessage = "Cannot update more than 100 skills at once")]
    List<string> SkillIds,
    
    [Required(ErrorMessage = "Update data is required")]
    BulkSkillUpdateData UpdateData)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}

/// <summary>
/// Data for bulk skill update operations
/// </summary>
/// <param name="IsActive">Whether to activate or deactivate skills</param>
/// <param name="SkillCategoryId">New category ID for skills</param>
/// <param name="AddTags">Tags to add to skills</param>
/// <param name="RemoveTags">Tags to remove from skills</param>
public record BulkSkillUpdateData(
    bool? IsActive = null,
    
    string? SkillCategoryId = null,
    
    List<string>? AddTags = null,
    
    List<string>? RemoveTags = null);
