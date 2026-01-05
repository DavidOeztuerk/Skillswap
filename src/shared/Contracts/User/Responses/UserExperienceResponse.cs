namespace Contracts.User.Responses;

/// <summary>
/// Response for a user's work experience entry
/// </summary>
public record UserExperienceResponse(
    string Id,
    string Title,
    string Company,
    DateTime StartDate,
    DateTime? EndDate,
    string? Description,
    bool IsCurrent);
