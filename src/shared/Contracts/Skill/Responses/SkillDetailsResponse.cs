namespace Contracts.Skill.Responses;

/// <summary>
/// API response containing detailed skill information
/// </summary>
/// <param name="SkillId">Unique identifier for the skill</param>
/// <param name="Name">Name of the skill</param>
/// <param name="Description">Detailed description</param>
/// <param name="Category">Skill category information</param>
/// <param name="ProficiencyLevel">Proficiency level information</param>
/// <param name="Tags">Associated tags</param>
/// <param name="Owner">Skill owner information</param>
/// <param name="IsOffered">Whether skill is offered</param>
/// <param name="IsWanted">Whether skill is wanted</param>
/// <param name="Rating">Average rating</param>
/// <param name="ReviewCount">Number of reviews</param>
/// <param name="EndorsementCount">Number of endorsements</param>
/// <param name="AvailableHours">Available hours per week</param>
/// <param name="PreferredSessionDuration">Preferred session duration</param>
/// <param name="Location">Preferred location</param>
/// <param name="IsRemote">Remote availability</param>
/// <param name="Status">Current status</param>
/// <param name="CreatedAt">Creation timestamp</param>
/// <param name="UpdatedAt">Last update timestamp</param>
public record SkillDetailsResponse(
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
    int EndorsementCount,
    int? AvailableHours,
    int? PreferredSessionDuration,
    string? Location,
    bool IsRemote,
    string Status,
    DateTime CreatedAt,
    DateTime? UpdatedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

public record ProficiencyLevelInfo(string Id, string Name, string Description, int Level);
public record SkillOwnerInfo(string UserId, string FirstName, string LastName, string UserName, decimal? Rating);
