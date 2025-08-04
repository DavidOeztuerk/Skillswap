using Contracts.Common;

namespace Contracts.Skill.Responses;

/// <summary>
/// API response containing detailed skill information
/// </summary>
/// <param name="SkillId">Unique identifier for the skill</param>
/// <param name="UserId"></param>
/// <param name="Name">Name of the skill</param>
/// <param name="Description">Detailed description</param>
/// <param name="Category">Skill category information</param>
/// <param name="ProficiencyLevel">Proficiency level information</param>
/// <param name="Tags">Associated tags</param>
/// <param name="Owner">Skill owner information</param>
/// <param name="IsOffered">Whether skill is offered</param>
/// <param name="Rating">Average rating</param>
/// <param name="Reviews">Number of reviews</param>
/// <param name="Endorsements">Number of endorsements</param>
/// <param name="AvailableHours">Available hours per week</param>
/// <param name="PreferredSessionDuration">Preferred session duration</param>
/// <param name="IsRemote">Remote availability</param>
/// <param name="Status">Current status</param>
/// <param name="CreatedAt">Creation timestamp</param>
/// <param name="UpdatedAt">Last update timestamp</param>
public record SkillDetailsResponse(
    string SkillId,
    string UserId,
    string Name,
    string Description,
    SkillCategoryResponse Category,
    ProficiencyLevelResponse ProficiencyLevel,
    List<string> Tags,
    bool IsOffered,
    decimal? Rating,
    List<SkillReviewResponse>? Reviews,
    List<SkillEndorsementResponse>? Endorsements,
    int? AvailableHours,
    int? PreferredSessionDuration,
    bool IsRemote,
    string Status,
    DateTime CreatedAt,
    DateTime? UpdatedAt)
    : IVersionedContract
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

// /// <summary>
// /// Proficiency level info
// /// </summary>
// /// <param name="LevelId">Unique identifier for the level</param>
// /// <param name="Level">Name of the proficiency level</param>
// /// <param name="Rank">Rank of the proficiency level</param>
// /// <param name="Color">Color associated with the level</param>
// /// <param name="SkillCount">Number of skills at this level</param>
// public record ProficiencyLevelInfo(
//     string LevelId,
//     string Level,
//     int Rank,
//     string? Color,
    // int? SkillCount);

// public record SkillOwnerInfo(string UserId, string FirstName, string LastName, string UserName, decimal? Rating);

// public record SkillDetailsResponse(
//     string SkillId,
//     string UserId,
//     string Name,
//     string Description,
//     bool IsOffering,
//     SkillCategoryResponse Category,
//     ProficiencyLevelResponse ProficiencyLevel,
//     List<string> Tags,
//     string? Requirements,
//     bool IsRemoteAvailable,
//     int? EstimatedDurationMinutes,
//     double? AverageRating,
//     List<SkillReviewResponse>? Reviews,
//     List<SkillEndorsementResponse>? Endorsements,
//     DateTime CreatedAt,
//     DateTime UpdatedAt,
//     DateTime? LastActiveAt,
//     bool IsActive);

// public record SkillReviewResponse(
//     string ReviewId,
//     string ReviewerUserId,
//     int Rating,
//     string? Comment,
//     List<string> Tags,
//     DateTime CreatedAt);

// public record SkillEndorsementResponse(
//     string EndorsementId,
//     string EndorserUserId,
//     string? Message,
//     DateTime CreatedAt);