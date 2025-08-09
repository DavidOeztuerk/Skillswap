using Contracts.Common;

namespace Contracts.User.Responses.Auth;

/// <summary>
/// API response for successful user registration
/// </summary>
/// <param name="AccessToken">JWT access token</param>
/// <param name="RefreshToken">JWT refresh token</param>
/// <param name="TokenType">Type of token (Bearer)</param>
/// <param name="ExpiresAt">When the access token expires</param>
/// <param name="UserInfo">User details</param>
/// <param name="EmailVerificationRequired">Whether email verification is required</param>
/// <param name="Permissions">User permissions and roles</param>
public record RegisterResponse(
    string AccessToken,
    string RefreshToken,
    TokenType TokenType,
    DateTime ExpiresAt,
    UserInfo UserInfo,
    bool EmailVerificationRequired,
    UserPermissions? Permissions = null)
    : IVersionedContract
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
