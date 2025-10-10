namespace Contracts.User.Responses;

/// <summary>
/// Public user profile response for service-to-service communication
/// </summary>
public record PublicUserProfileResponse(
    string UserId,
    string FirstName,
    string LastName,
    string UserName,
    string? Bio,
    string? AvatarUrl,
    DateTime MemberSince,
    int SkillsOffered,
    int SkillsLearned,
    double AverageRating,
    int TotalReviews,
    bool IsBlocked,
    List<string> Languages,
    string? TimeZone);
