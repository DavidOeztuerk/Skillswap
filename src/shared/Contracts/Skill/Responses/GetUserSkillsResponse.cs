using Infrastructure.Models;

namespace Contracts.Skill.Responses;

/// <summary>
/// API response for GetUserSkills operation
/// </summary>
/// <param name="Skills">List of user skills</param>
/// <param name="TotalCount">Total number of user skills</param>
/// <param name="PageNumber">Current page number</param>
/// <param name="PageSize">Page size used</param>
/// <param name="HasNextPage">Whether there are more pages</param>
public record GetUserSkillsResponse(
    List<UserSkillResponse> Skills,
    int TotalCount,
    int PageNumber,
    int PageSize,
    bool HasNextPage)
    : PagedResponse
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

/// <summary>
/// Individual user skill response
/// </summary>
/// <param name="SkillId">Unique identifier for the skill</param>
/// <param name="Name">Name of the skill</param>
/// <param name="Description">Detailed description of the skill</param>
/// <param name="IsOffering">Whether the user is offering this skill</param>
/// <param name="Category">Skill category information</param>
/// <param name="ProficiencyLevel">Proficiency level information</param>
/// <param name="Tags">Associated tags for the skill</param>
/// <param name="AverageRating">Average rating for the skill</param>
/// <param name="ReviewCount">Number of reviews for the skill</param>
/// <param name="EndorsementCount">Number of endorsements for the skill</param>
/// <param name="CreatedAt">When the skill was created</param>
/// <param name="UpdatedAt">When the skill was last updated</param>
/// <param name="IsActive">Whether the skill is active</param>
public record UserSkillResponse(
    string SkillId,
    string Name,
    string Description,
    bool IsOffering,
    SkillCategoryResponse Category,
    ProficiencyLevelResponse ProficiencyLevel,
    List<string> Tags,
    double? AverageRating,
    int ReviewCount,
    int EndorsementCount,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    bool IsActive);

/// <summary>
/// Skill category response
/// </summary>
/// <param name="CategoryId">Unique identifier for the category</param>
/// <param name="Name">Name of the category</param>
/// <param name="Description">Description of the category</param>
/// <param name="IconName">Icon name for the category</param>
/// <param name="Color">Color associated with the category</param>
/// <param name="SortOrder">Sort order for the category</param>
/// <param name="SkillCount">Number of skills in the category</param>
/// <param name="IsActive">Whether the category is active</param>
/// <param name="CreatedAt">When the category was created</param>
public record SkillCategoryResponse(
    string CategoryId,
    string Name,
    string? Description,
    string? IconName,
    string? Color,
    int SortOrder,
    int? SkillCount,
    bool IsActive,
    DateTime CreatedAt);

/// <summary>
/// Proficiency level response
/// </summary>
/// <param name="LevelId">Unique identifier for the level</param>
/// <param name="Level">Name of the proficiency level</param>
/// <param name="Description">Description of the proficiency level</param>
/// <param name="Rank">Rank of the proficiency level</param>
/// <param name="Color">Color associated with the level</param>
/// <param name="SkillCount">Number of skills at this level</param>
/// <param name="IsActive">Whether the level is active</param>
/// <param name="CreatedAt">When the level was created</param>
public record ProficiencyLevelResponse(
    string LevelId,
    string Level,
    string? Description,
    int Rank,
    string? Color,
    int? SkillCount,
    bool IsActive,
    DateTime CreatedAt);
