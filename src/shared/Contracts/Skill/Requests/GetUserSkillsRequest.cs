namespace Contracts.Skill.Requests;

/// <summary>
/// API request for retrieving user skills with filtering and pagination
/// </summary>
/// <param name="IsOffered">Filter by whether skills are offered (null for all)</param>
/// <param name="CategoryId">Filter by skill category identifier</param>
/// <param name="ProficiencyLevelId">Filter by proficiency level identifier</param>
/// <param name="IncludeInactive">Whether to include inactive skills</param>
/// <param name="PageNumber">Page number for pagination</param>
/// <param name="PageSize">Page size for pagination</param>
public record GetUserSkillsRequest(
    bool? IsOffered = null,
    string? CategoryId = null,
    string? ProficiencyLevelId = null,
    bool IncludeInactive = false,
    int PageNumber = 1,
    int PageSize = 12);
