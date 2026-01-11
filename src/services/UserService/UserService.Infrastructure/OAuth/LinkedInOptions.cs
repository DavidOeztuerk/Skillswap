namespace UserService.Infrastructure.OAuth;

/// <summary>
/// Configuration options for LinkedIn OAuth 2.0
/// </summary>
public class LinkedInOptions
{
  public const string SectionName = "OAuth:LinkedIn";

  /// <summary>
  /// LinkedIn OAuth 2.0 Client ID (Application ID)
  /// </summary>
  public string ClientId { get; set; } = string.Empty;

  /// <summary>
  /// LinkedIn OAuth 2.0 Client Secret
  /// </summary>
  public string ClientSecret { get; set; } = string.Empty;

  /// <summary>
  /// LinkedIn OAuth 2.0 Authorization Endpoint
  /// Default: https://www.linkedin.com/oauth/v2/authorization
  /// </summary>
  public string AuthorizationEndpoint { get; set; } = "https://www.linkedin.com/oauth/v2/authorization";

  /// <summary>
  /// LinkedIn OAuth 2.0 Token Endpoint
  /// Default: https://www.linkedin.com/oauth/v2/accessToken
  /// </summary>
  public string TokenEndpoint { get; set; } = "https://www.linkedin.com/oauth/v2/accessToken";

  /// <summary>
  /// LinkedIn OpenID Connect UserInfo Endpoint
  /// Default: https://api.linkedin.com/v2/userinfo
  /// </summary>
  public string UserInfoEndpoint { get; set; } = "https://api.linkedin.com/v2/userinfo";

  /// <summary>
  /// LinkedIn Profile API Endpoint
  /// Default: https://api.linkedin.com/v2/me
  /// </summary>
  public string ProfileEndpoint { get; set; } = "https://api.linkedin.com/v2/me";

  /// <summary>
  /// OAuth scopes to request
  /// Default: openid, profile, email
  /// </summary>
  public List<string> Scopes { get; set; } = ["openid", "profile", "email"];

  /// <summary>
  /// Default redirect URI for OAuth callback
  /// </summary>
  public string DefaultRedirectUri { get; set; } = string.Empty;

  /// <summary>
  /// Check if the configuration is valid
  /// </summary>
  public bool IsConfigured => !string.IsNullOrEmpty(ClientId) && !string.IsNullOrEmpty(ClientSecret);
}
