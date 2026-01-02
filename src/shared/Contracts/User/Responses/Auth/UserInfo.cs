namespace Contracts.User.Responses.Auth;

/// <summary>
/// Basic information about a registered user
/// </summary>
/// <param name="UserId">Unique user ID</param>
/// <param name="Email">User email address</param>
/// <param name="FirstName">First name</param>
/// <param name="LastName">Last name</param>
/// <param name="UserName">Display or login name</param>
/// <param name="Roles">Assigned roles</param>
/// <param name="EmailVerified">Whether email is verified</param>
/// <param name="AccountStatus">Current account state</param>
public record UserInfo(
    string UserId,
    string Email,
    string FirstName,
    string LastName,
    string UserName,
    IReadOnlyList<string> Roles,
    bool EmailVerified,
    string AccountStatus);
