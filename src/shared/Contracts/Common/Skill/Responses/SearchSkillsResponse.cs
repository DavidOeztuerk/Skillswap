namespace Contracts.Skill.Responses;

/// <summary>
/// API response for SearchSkills operation
/// </summary>
/// <param name="Skills">List of skills matching the search criteria</param>
/// <param name="TotalCount">Total number of skills matching the search</param>
/// <param name="Page">Current page number</param>
/// <param name="PageSize">Number of skills per page</param>
/// <param name="TotalPages">Total number of pages</param>
public record SearchSkillsResponse(
    List<SkillSummary> Skills,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

/// <summary>
/// Summary information about a skill for search results
/// </summary>
/// <param name="SkillId">Skill identifier</param>
/// <param name="Name">Skill name</param>
/// <param name="Description">Skill description</param>
/// <param name="Category">Skill category</param>
/// <param name="ProficiencyLevel">Proficiency level</param>
/// <param name="Tags">Associated tags</param>
/// <param name="Owner">Skill owner information</param>
/// <param name="IsOffered">Whether skill is offered</param>
/// <param name="IsWanted">Whether skill is wanted</param>
/// <param name="Rating">Average rating</param>
/// <param name="ReviewCount">Number of reviews</param>
/// <param name="Location">Preferred location</param>
/// <param name="IsRemote">Remote availability</param>
/// <param name="Status">Current status</param>
/// <param name="CreatedAt">Creation timestamp</param>
public record SkillSummary(
    string SkillId,
    string Name,
    string Description,
    SkillCategoryInfo? Category,
    ProficiencyLevelInfo ProficiencyLevel,
    List<string> Tags,
    SkillOwnerInfo Owner,
    bool IsOffered,
    bool IsWanted,
    decimal? Rating,
    int ReviewCount,
    string? Location,
    bool IsRemote,
    string Status,
    DateTime CreatedAt);