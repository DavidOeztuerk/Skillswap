namespace Contracts.User.Responses;

/// <summary>
/// API response for successful user registration
/// </summary>
/// <param name="UserId">Unique identifier for the created user</param>
/// <param name="Email">User's email address</param>
/// <param name="FirstName">User's first name</param>
/// <param name="LastName">User's last name</param>
/// <param name="UserName">User's username</param>
/// <param name="AccessToken">JWT access token</param>
/// <param name="RefreshToken">JWT refresh token</param>
/// <param name="TokenType">Type of token (Bearer)</param>
/// <param name="ExpiresAt">When the access token expires</param>
/// <param name="EmailVerificationRequired">Whether email verification is required</param>
public record RegisterUserResponse(
    string UserId,
    string Email,
    string FirstName,
    string LastName,
    string UserName,
    string AccessToken,
    string RefreshToken,
    string TokenType,
    DateTime ExpiresAt,
    bool EmailVerificationRequired)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}