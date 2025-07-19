using System.ComponentModel.DataAnnotations;

namespace Contracts.Skill.Requests;

/// <summary>
/// API request for importing multiple skills in bulk
/// </summary>
/// <param name="Skills">List of skill data to import</param>
/// <param name="OverwriteExisting">Whether to overwrite existing skills with same name</param>
/// <param name="ValidateOnly">Whether to only validate without importing</param>
public record ImportSkillsRequest(
    [Required(ErrorMessage = "Skills data is required")]
    [MinLength(1, ErrorMessage = "At least one skill is required")]
    [MaxLength(500, ErrorMessage = "Cannot import more than 500 skills at once")]
    List<SkillImportData> Skills,
    
    bool OverwriteExisting = false,
    
    bool ValidateOnly = false)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}

/// <summary>
/// Skill data for import operations
/// </summary>
/// <param name="Name">Skill name</param>
/// <param name="Description">Skill description</param>
/// <param name="IsOffering">Whether the skill is being offered</param>
/// <param name="CategoryName">Category name</param>
/// <param name="ProficiencyLevelName">Proficiency level name</param>
/// <param name="Tags">Optional tags</param>
public record SkillImportData(
    [Required(ErrorMessage = "Skill name is required")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "Skill name must be between 3 and 100 characters")]
    string Name,
    
    [Required(ErrorMessage = "Description is required")]
    [StringLength(2000, MinimumLength = 10, ErrorMessage = "Description must be between 10 and 2000 characters")]
    string Description,
    
    [Required(ErrorMessage = "Must specify if skill is being offered")]
    bool IsOffering,
    
    [Required(ErrorMessage = "Category name is required")]
    string CategoryName,
    
    [Required(ErrorMessage = "Proficiency level name is required")]
    string ProficiencyLevelName,
    
    List<string>? Tags = null);
