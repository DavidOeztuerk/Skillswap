namespace Contracts.User.Responses;

/// <summary>
/// API response for successful user profile update
/// </summary>
/// <param name="UserId">Unique identifier for the user</param>
/// <param name="Email">User's email address</param>
/// <param name="FirstName">Updated first name</param>
/// <param name="LastName">Updated last name</param>
/// <param name="UserName">User's username</param>
/// <param name="PhoneNumber">Updated phone number</param>
/// <param name="Bio">Updated biography</param>
/// <param name="TimeZone">Updated timezone</param>
/// <param name="Location">Updated location</param>
/// <param name="UpdatedAt">When the profile was last updated</param>
public record UpdateUserProfileResponse(
    string UserId,
    string Email,
    string FirstName,
    string LastName,
    string UserName,
    string? PhoneNumber,
    string? Bio,
    string? TimeZone,
    string? Location,
    DateTime UpdatedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}