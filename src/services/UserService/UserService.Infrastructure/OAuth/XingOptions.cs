namespace UserService.Infrastructure.OAuth;

/// <summary>
/// Configuration options for Xing OAuth 1.0a
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public class XingOptions
{
    public const string SectionName = "OAuth:Xing";

    /// <summary>
    /// Xing OAuth 1.0a Consumer Key
    /// </summary>
    public string ConsumerKey { get; set; } = string.Empty;

    /// <summary>
    /// Xing OAuth 1.0a Consumer Secret
    /// </summary>
    public string ConsumerSecret { get; set; } = string.Empty;

    /// <summary>
    /// Xing OAuth 1.0a Request Token URL
    /// Default: https://api.xing.com/v1/request_token
    /// </summary>
    public string RequestTokenUrl { get; set; } = "https://api.xing.com/v1/request_token";

    /// <summary>
    /// Xing OAuth 1.0a Authorize URL
    /// Default: https://api.xing.com/v1/authorize
    /// </summary>
    public string AuthorizeUrl { get; set; } = "https://api.xing.com/v1/authorize";

    /// <summary>
    /// Xing OAuth 1.0a Access Token URL
    /// Default: https://api.xing.com/v1/access_token
    /// </summary>
    public string AccessTokenUrl { get; set; } = "https://api.xing.com/v1/access_token";

    /// <summary>
    /// Xing Profile API URL
    /// Default: https://api.xing.com/v1/users/me
    /// </summary>
    public string ProfileUrl { get; set; } = "https://api.xing.com/v1/users/me";

    /// <summary>
    /// Default callback URL for OAuth
    /// </summary>
    public string DefaultCallbackUrl { get; set; } = string.Empty;

    /// <summary>
    /// Check if the configuration is valid
    /// </summary>
    public bool IsConfigured => !string.IsNullOrEmpty(ConsumerKey) && !string.IsNullOrEmpty(ConsumerSecret);
}
