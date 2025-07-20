namespace Contracts.User.Responses;

/// <summary>
/// API response for successful token refresh
/// </summary>
/// <param name="AccessToken">New JWT access token</param>
/// <param name="RefreshToken">New JWT refresh token</param>
/// <param name="TokenType">Type of token (Bearer)</param>
/// <param name="ExpiresAt">When the access token expires</param>
public record RefreshTokenResponse(
    string AccessToken,
    string RefreshToken,
    string TokenType,
    int ExpiresIn,
    DateTime ExpiresAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
