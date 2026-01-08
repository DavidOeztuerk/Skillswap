namespace Contracts.Skill.Responses;

/// <summary>
/// Individual user skill response
/// </summary>
/// <param name="UserId">Owner user ID</param>
/// <param name="SkillId">Unique identifier for the skill</param>
/// <param name="Name">Name of the skill</param>
/// <param name="Description">Detailed description of the skill</param>
/// <param name="Category">Skill category information</param>
/// <param name="Tags">Associated tags for the skill</param>
/// <param name="IsOffered">Whether the user is offering this skill</param>
/// <param name="AverageRating">Average rating for the skill</param>
/// <param name="ReviewCount">Number of reviews for the skill</param>
/// <param name="EndorsementCount">Number of endorsements for the skill</param>
/// <param name="CreatedAt">When the skill was created</param>
/// <param name="UpdatedAt">When the skill was last updated</param>
public record UserSkillResponse(
    string UserId,
    string SkillId,
    string Name,
    string Description,
    SkillCategoryResponse Category,
    List<string> Tags,
    bool IsOffered,
    double? AverageRating,
    int ReviewCount,
    int EndorsementCount,
    DateTime CreatedAt,
    DateTime UpdatedAt);

/// <summary>
/// Skill category response
/// </summary>
/// <param name="CategoryId">Unique identifier for the category</param>
/// <param name="Name">Name of the category</param>
/// <param name="IconName">Icon name for the category</param>
/// <param name="Color">Color associated with the category</param>
/// <param name="SkillCount">Number of skills in the category</param>
public record SkillCategoryResponse(
    string CategoryId,
    string Name,
    string? IconName,
    string? Color,
    int? SkillCount);
