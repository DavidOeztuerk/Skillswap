namespace Contracts.User.Responses;

/// <summary>
/// Response for a user's education entry
/// </summary>
public record UserEducationResponse(
    string Id,
    string Degree,
    string Institution,
    int? GraduationYear,
    int? GraduationMonth,
    string? Description);
