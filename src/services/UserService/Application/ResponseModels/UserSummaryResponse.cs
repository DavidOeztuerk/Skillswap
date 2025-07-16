namespace UserService.Application.ResponseModels;

/// <summary>
/// Summary response for user listings (admin/search)
/// </summary>
public record UserSummaryResponse(
    string UserId,
    string Email,
    string FirstName,
    string LastName,
    string UserName,
    List<string> Roles,
    bool EmailVerified,
    string AccountStatus,
    DateTime CreatedAt,
    DateTime? LastLoginAt);