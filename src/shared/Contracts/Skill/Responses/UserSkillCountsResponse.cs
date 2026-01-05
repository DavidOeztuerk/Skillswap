namespace Contracts.Skill.Responses;

/// <summary>
/// Response containing skill counts for a user (used for public profiles)
/// </summary>
public record UserSkillCountsResponse(
    string UserId,
    int OfferedCount,
    int RequestedCount,
    int TotalCount
);
