namespace Contracts.User.Responses;

/// <summary>
/// API response for successful user login
/// </summary>
/// <param name="UserId">Unique identifier for the user</param>
/// <param name="Email">User's email address</param>
/// <param name="FirstName">User's first name</param>
/// <param name="LastName">User's last name</param>
/// <param name="UserName">User's username</param>
/// <param name="AccessToken">JWT access token</param>
/// <param name="RefreshToken">JWT refresh token</param>
/// <param name="TokenType">Type of token (Bearer)</param>
/// <param name="ExpiresAt">When the access token expires</param>
/// <param name="Roles">User's assigned roles</param>
/// <param name="TwoFactorRequired">Whether two-factor authentication is required</param>
/// <param name="EmailVerified">Whether the user's email is verified</param>
/// <summary>
/// API response for successful authentication
/// </summary>
public record LoginResponse(
    string AccessToken,
    string RefreshToken,
    string TokenType,
    int ExpiresIn,
    DateTime ExpiresAt,
    UserInfo User,
    bool RequiresTwoFactor = false,
    string? TwoFactorMethod = null)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

public record UserInfo(
    string UserId,
    string Email,
    string FirstName,
    string LastName,
    string UserName,
    List<string> Roles,
    bool EmailVerified,
    string AccountStatus);