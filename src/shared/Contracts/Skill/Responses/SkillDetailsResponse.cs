using Contracts.Common;

namespace Contracts.Skill.Responses;

/// <summary>
/// API response containing detailed skill information
/// </summary>
/// <param name="SkillId">Unique identifier for the skill</param>
/// <param name="UserId">Owner user ID</param>
/// <param name="OwnerUserName">Owner's username</param>
/// <param name="OwnerFirstName">Owner's first name</param>
/// <param name="OwnerLastName">Owner's last name</param>
/// <param name="OwnerRating">Owner's average rating</param>
/// <param name="OwnerMemberSince">When the owner joined</param>
/// <param name="Name">Name of the skill</param>
/// <param name="Description">Detailed description</param>
/// <param name="Category">Skill category information</param>
/// <param name="Tags">Associated tags</param>
/// <param name="IsOffered">Whether skill is offered</param>
/// <param name="Rating">Average rating</param>
/// <param name="Reviews">Number of reviews</param>
/// <param name="Endorsements">Number of endorsements</param>
/// <param name="AvailableHours">Available hours per week</param>
/// <param name="PreferredSessionDuration">Preferred session duration</param>
/// <param name="Status">Current status</param>
/// <param name="CreatedAt">Creation timestamp</param>
/// <param name="UpdatedAt">Last update timestamp</param>
/// <param name="ExchangeType">Exchange type (skill_exchange or payment)</param>
/// <param name="DesiredSkillCategoryId">Desired skill category for exchange</param>
/// <param name="DesiredSkillDescription">Description of desired skill</param>
/// <param name="HourlyRate">Hourly rate for payment</param>
/// <param name="Currency">Currency code</param>
/// <param name="PreferredDays">Preferred days of week</param>
/// <param name="PreferredTimes">Preferred times of day</param>
/// <param name="SessionDurationMinutes">Session duration in minutes</param>
/// <param name="TotalSessions">Total number of sessions</param>
/// <param name="LocationType">Location type (remote, in_person, both)</param>
/// <param name="LocationAddress">Street address</param>
/// <param name="LocationCity">City name</param>
/// <param name="LocationPostalCode">Postal code</param>
/// <param name="LocationCountry">Country code</param>
/// <param name="MaxDistanceKm">Maximum distance for in-person</param>
public record SkillDetailsResponse(
    string SkillId,
    string UserId,
    string? OwnerUserName,
    string? OwnerFirstName,
    string? OwnerLastName,
    double? OwnerRating,
    DateTime? OwnerMemberSince,
    string Name,
    string Description,
    SkillCategoryResponse Category,
    List<string> Tags,
    bool IsOffered,
    decimal? Rating,
    List<SkillReviewResponse>? Reviews,
    List<SkillEndorsementResponse>? Endorsements,
    int? AvailableHours,
    int? PreferredSessionDuration,
    string Status,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    // Exchange options
    string? ExchangeType = null,
    string? DesiredSkillCategoryId = null,
    string? DesiredSkillDescription = null,
    decimal? HourlyRate = null,
    string? Currency = null,
    // Scheduling
    List<string>? PreferredDays = null,
    List<string>? PreferredTimes = null,
    int? SessionDurationMinutes = null,
    int? TotalSessions = null,
    // Location
    string? LocationType = null,
    string? LocationAddress = null,
    string? LocationCity = null,
    string? LocationPostalCode = null,
    string? LocationCountry = null,
    int? MaxDistanceKm = null)
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