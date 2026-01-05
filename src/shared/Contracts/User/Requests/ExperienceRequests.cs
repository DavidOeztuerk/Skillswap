namespace Contracts.User.Requests;

/// <summary>
/// Request to add a new experience entry
/// </summary>
public record AddExperienceRequest(
    string Title,
    string Company,
    DateTime StartDate,
    DateTime? EndDate,
    string? Description,
    int SortOrder = 0);

/// <summary>
/// Request to update an experience entry
/// </summary>
public record UpdateExperienceRequest(
    string Title,
    string Company,
    DateTime StartDate,
    DateTime? EndDate,
    string? Description,
    int SortOrder);
