namespace Contracts.Skill.Responses;

/// <summary>
/// API response for GetSkillCategories operation
/// </summary>
/// <param name="Categories">List of skill categories</param>
public record GetSkillCategoriesResponse(
    List<SkillCategoryInfo> Categories)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

/// <summary>
/// Information about a skill category
/// </summary>
/// <param name="CategoryId">Category identifier</param>
/// <param name="Name">Category name</param>
/// <param name="Description">Category description</param>
/// <param name="IconName">Category icon name</param>
/// <param name="Color">Category color</param>
/// <param name="SortOrder">Sort order</param>
/// <param name="SkillCount">Number of skills in this category</param>
/// <param name="IsActive">Whether the category is active</param>
/// <param name="CreatedAt">When the category was created</param>
public record SkillCategoryInfo(
    string CategoryId,
    string Name,
    string? Description,
    string? IconName,
    string? Color,
    int SortOrder,
    int? SkillCount,
    bool IsActive,
    DateTime CreatedAt);
