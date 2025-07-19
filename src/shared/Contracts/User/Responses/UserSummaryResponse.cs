namespace Contracts.User.Responses;

/// <summary>
/// API response containing summary user information for listings
/// </summary>
/// <param name="UserId">Unique identifier for the user</param>
/// <param name="FirstName">User's first name</param>
/// <param name="LastName">User's last name</param>
/// <param name="UserName">User's username</param>
/// <param name="Skills">List of user's primary skills</param>
/// <param name="Location">User's location</param>
/// <param name="Rating">User's average rating</param>
/// <param name="ReviewCount">Number of reviews</param>
/// <param name="IsAvailable">Whether user is currently available</param>
/// <param name="JoinedAt">When the user joined</param>
public record UserSummaryResponse(
    string UserId,
    string FirstName,
    string LastName,
    string UserName,
    List<string> Skills,
    string? Location,
    decimal? Rating,
    int ReviewCount,
    bool IsAvailable,
    DateTime JoinedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}