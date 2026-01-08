namespace UserService.Domain.Services;

/// <summary>
/// Xing profile position (experience)
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public record XingPosition
{
    public string Id { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string CompanyName { get; init; } = string.Empty;
    public string? Location { get; init; }
    public string? Description { get; init; }
    public DateTime? BeginDate { get; init; }
    public DateTime? EndDate { get; init; }
    public bool IsPrimary { get; init; }
}

/// <summary>
/// Xing profile education
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public record XingEducation
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Degree { get; init; }
    public string? Subject { get; init; }
    public string? Notes { get; init; }
    public int? BeginYear { get; init; }
    public int? BeginMonth { get; init; }
    public int? EndYear { get; init; }
    public int? EndMonth { get; init; }
}

/// <summary>
/// Xing profile data
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public record XingProfile
{
    public string Id { get; init; } = string.Empty;
    public string? FirstName { get; init; }
    public string? LastName { get; init; }
    public string? Email { get; init; }
    public string? Permalink { get; init; }
    public string? PhotoUrls { get; init; }
    public string? ActiveEmail { get; init; }
    public List<XingPosition> ProfessionalExperience { get; init; } = [];
    public List<XingEducation> EducationalBackground { get; init; } = [];
}

/// <summary>
/// OAuth 1.0a request token result for Xing
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public record XingRequestTokenResult
{
    public bool Success { get; init; }
    public string? OAuthToken { get; init; }
    public string? OAuthTokenSecret { get; init; }
    public string? Error { get; init; }

    public static XingRequestTokenResult Succeeded(string oauthToken, string oauthTokenSecret) =>
        new() { Success = true, OAuthToken = oauthToken, OAuthTokenSecret = oauthTokenSecret };

    public static XingRequestTokenResult Failed(string error) =>
        new() { Success = false, Error = error };
}

/// <summary>
/// OAuth 1.0a access token result for Xing
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public record XingTokenResult
{
    public bool Success { get; init; }
    public string? AccessToken { get; init; }
    public string? TokenSecret { get; init; }
    public string? XingId { get; init; }
    public string? Email { get; init; }
    public string? Error { get; init; }

    public static XingTokenResult Succeeded(string accessToken, string tokenSecret, string xingId, string? email = null) =>
        new() { Success = true, AccessToken = accessToken, TokenSecret = tokenSecret, XingId = xingId, Email = email };

    public static XingTokenResult Failed(string error) =>
        new() { Success = false, Error = error };
}

/// <summary>
/// Profile fetch result for Xing
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public record XingProfileResult
{
    public bool Success { get; init; }
    public XingProfile? Profile { get; init; }
    public string? Error { get; init; }

    public static XingProfileResult Succeeded(XingProfile profile) =>
        new() { Success = true, Profile = profile };

    public static XingProfileResult Failed(string error) =>
        new() { Success = false, Error = error };
}

/// <summary>
/// Interface for Xing OAuth 1.0a service
/// Phase 12: LinkedIn/Xing Integration
/// Note: Xing uses OAuth 1.0a which requires request token before authorization
/// </summary>
public interface IXingService
{
    /// <summary>
    /// Get request token (first step of OAuth 1.0a)
    /// </summary>
    Task<XingRequestTokenResult> GetRequestTokenAsync(string callbackUrl, CancellationToken cancellationToken = default);

    /// <summary>
    /// Generate OAuth 1.0a authorization URL for Xing
    /// </summary>
    string GetAuthorizationUrl(string requestToken);

    /// <summary>
    /// Exchange verifier for access token (uses request token + verifier)
    /// </summary>
    Task<XingTokenResult> ExchangeVerifierForTokensAsync(
        string requestToken,
        string requestTokenSecret,
        string oauthVerifier,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get basic profile info (id, name, email)
    /// </summary>
    Task<XingProfileResult> GetBasicProfileAsync(
        string accessToken,
        string tokenSecret,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get full profile with positions and educations
    /// </summary>
    Task<XingProfileResult> GetFullProfileAsync(
        string accessToken,
        string tokenSecret,
        CancellationToken cancellationToken = default);
}
