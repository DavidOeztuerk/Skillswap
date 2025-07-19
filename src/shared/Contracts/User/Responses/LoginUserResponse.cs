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
public record LoginUserResponse(
    string UserId,
    string Email,
    string FirstName,
    string LastName,
    string UserName,
    string AccessToken,
    string RefreshToken,
    string TokenType,
    DateTime ExpiresAt,
    List<string> Roles,
    bool TwoFactorRequired,
    bool EmailVerified)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}