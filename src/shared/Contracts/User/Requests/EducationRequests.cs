namespace Contracts.User.Requests;

/// <summary>
/// Request to add a new education entry
/// </summary>
public record AddEducationRequest(
    string Degree,
    string Institution,
    int? GraduationYear,
    int? GraduationMonth,
    string? Description,
    int SortOrder = 0);

/// <summary>
/// Request to update an education entry
/// </summary>
public record UpdateEducationRequest(
    string Degree,
    string Institution,
    int? GraduationYear,
    int? GraduationMonth,
    string? Description,
    int SortOrder);
