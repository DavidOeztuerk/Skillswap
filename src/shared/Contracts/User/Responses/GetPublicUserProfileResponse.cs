namespace Contracts.User.Responses;

/// <summary>
/// API response for GetPublicUserProfile operation
/// </summary>
public record GetPublicUserProfileResponse(
    string UserId,
    string UserName,
    string? Bio,
    string? ProfilePictureUrl,
    List<string> SkillsOffered,
    List<string> SkillsWanted,
    double AverageRating,
    DateTime MemberSince)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}