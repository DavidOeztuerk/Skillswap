namespace Contracts.User.Responses;

/// <summary>
/// API response containing user profile information
/// </summary>
/// <param name="UserId">Unique identifier for the user</param>
/// <param name="Email">User's email address</param>
/// <param name="FirstName">User's first name</param>
/// <param name="LastName">User's last name</param>
/// <param name="UserName">User's username</param>
/// <param name="PhoneNumber">User's phone number</param>
/// <param name="Bio">User's biography</param>
/// <param name="TimeZone">User's timezone</param>
/// <param name="Roles">User's assigned roles</param>
/// <param name="EmailVerified">Whether email is verified</param>
/// <param name="AccountStatus">Current account status</param>
/// <param name="CreatedAt">When the account was created</param>
/// <param name="LastLoginAt">Last login timestamp</param>
/// <param name="Preferences">User preferences dictionary</param>
public record UserProfileResponse(
    string UserId,
    string Email,
    string FirstName,
    string LastName,
    string UserName,
    string? PhoneNumber,
    string? Bio,
    string? TimeZone,
    List<string> Roles,
    bool EmailVerified,
    string AccountStatus,
    DateTime CreatedAt,
    DateTime? LastLoginAt,
    Dictionary<string, string>? Preferences)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}