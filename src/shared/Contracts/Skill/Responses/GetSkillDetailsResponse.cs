using Contracts.Common;

namespace Contracts.Skill.Responses;

/// <summary>
/// API response for GetSkillDetails operation
/// </summary>
/// <param name="SkillId">Unique identifier for the skill</param>
/// <param name="UserId">User ID who owns the skill</param>
/// <param name="Name">Name of the skill</param>
/// <param name="Description">Detailed description of the skill</param>
/// <param name="IsOffered">Whether the user offers this skill (true) or seeks to learn it (false)</param>
/// <param name="Category">Skill category information</param>
/// <param name="ProficiencyLevel">Proficiency level information</param>
/// <param name="Tags">Associated tags for the skill</param>
/// <param name="Requirements">Requirements for the skill</param>
/// <param name="EstimatedDurationMinutes">Estimated duration in minutes</param>
/// <param name="AverageRating">Average rating for the skill</param>
/// <param name="ReviewCount">Number of reviews for the skill</param>
/// <param name="EndorsementCount">Number of endorsements for the skill</param>
/// <param name="Reviews">List of reviews if included</param>
/// <param name="Endorsements">List of endorsements if included</param>
/// <param name="CreatedAt">When the skill was created</param>
/// <param name="UpdatedAt">When the skill was last updated</param>
/// <param name="LastActiveAt">When the skill was last active</param>
/// <param name="IsActive">Whether the skill is active</param>
public record GetSkillDetailsResponse(
    string SkillId,
    string UserId,
    string Name,
    string Description,
    bool IsOffered,
    SkillCategoryResponse Category,
    ProficiencyLevelResponse ProficiencyLevel,
    List<string> Tags,
    string? Requirements,
    int? EstimatedDurationMinutes,
    double? AverageRating,
    int ReviewCount,
    int EndorsementCount,
    List<SkillReviewResponse>? Reviews,
    List<SkillEndorsementResponse>? Endorsements,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? LastActiveAt,
    bool IsActive)
    : IVersionedContract
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

/// <summary>
/// Skill endorsement response
/// </summary>
/// <param name="EndorsementId">Unique identifier for the endorsement</param>
/// <param name="EndorserUserId">User ID who gave the endorsement</param>
/// <param name="Message">Endorsement message</param>
/// <param name="CreatedAt">When the endorsement was created</param>
public record SkillEndorsementResponse(
    string EndorsementId,
    string EndorserUserId,
    string? Message,
    DateTime CreatedAt);
