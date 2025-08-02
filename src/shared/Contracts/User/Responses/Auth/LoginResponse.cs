using Contracts.Common;

namespace Contracts.User.Responses.Auth;

/// <summary>
/// API response for a login attempt
/// </summary>
/// <param name="AccessToken">JWT access token (null if 2FA required)</param>
/// <param name="RefreshToken">JWT refresh token (null if 2FA required)</param>
/// <param name="TokenType">Type of token (Bearer)</param>
/// <param name="ExpiresAt">When the access token expires</param>
/// <param name="UserInfo">User details</param>
/// <param name="Requires2FA">Whether two-factor authentication is required</param>
/// <param name="TwoFactorToken">Temporary token to continue 2FA flow</param>
public record LoginResponse(
    string AccessToken,
    string RefreshToken,
    TokenType TokenType,
    DateTime ExpiresAt,
    UserInfo UserInfo,
    bool Requires2FA,
    string TwoFactorToken)
    : IVersionedContract
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
