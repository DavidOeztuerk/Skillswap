namespace UserService.Domain.Services;

/// <summary>
/// LinkedIn profile position (experience)
/// </summary>
public record LinkedInPosition
{
  public string Id { get; init; } = string.Empty;
  public string Title { get; init; } = string.Empty;
  public string CompanyName { get; init; } = string.Empty;
  public string? Location { get; init; }
  public string? Description { get; init; }
  public DateTime? StartDate { get; init; }
  public DateTime? EndDate { get; init; }
  public bool IsCurrent { get; init; }
}

/// <summary>
/// LinkedIn profile education
/// </summary>
public record LinkedInEducation
{
  public string Id { get; init; } = string.Empty;
  public string SchoolName { get; init; } = string.Empty;
  public string? Degree { get; init; }
  public string? FieldOfStudy { get; init; }
  public string? Description { get; init; }
  public int? StartYear { get; init; }
  public int? StartMonth { get; init; }
  public int? EndYear { get; init; }
  public int? EndMonth { get; init; }
}

/// <summary>
/// LinkedIn profile data
/// </summary>
public record LinkedInProfile
{
  public string Id { get; init; } = string.Empty;
  public string? FirstName { get; init; }
  public string? LastName { get; init; }
  public string? Email { get; init; }
  public string? ProfileUrl { get; init; }
  public string? ProfilePictureUrl { get; init; }
  public string? Headline { get; init; }
  public List<LinkedInPosition> Positions { get; init; } = [];
  public List<LinkedInEducation> Educations { get; init; } = [];
}

/// <summary>
/// OAuth 2.0 token result for LinkedIn
/// </summary>
public record LinkedInTokenResult
{
  public bool Success { get; init; }
  public string? AccessToken { get; init; }
  public string? RefreshToken { get; init; }
  public DateTime ExpiresAt { get; init; }
  public string? LinkedInId { get; init; }
  public string? Email { get; init; }
  public string? Error { get; init; }

  public static LinkedInTokenResult Succeeded(string accessToken, string? refreshToken, DateTime expiresAt, string linkedInId, string? email = null) =>
      new() { Success = true, AccessToken = accessToken, RefreshToken = refreshToken, ExpiresAt = expiresAt, LinkedInId = linkedInId, Email = email };

  public static LinkedInTokenResult Failed(string error) =>
      new() { Success = false, Error = error };
}

/// <summary>
/// Profile fetch result for LinkedIn
/// </summary>
public record LinkedInProfileResult
{
  public bool Success { get; init; }
  public LinkedInProfile? Profile { get; init; }
  public string? Error { get; init; }

  public static LinkedInProfileResult Succeeded(LinkedInProfile profile) =>
      new() { Success = true, Profile = profile };

  public static LinkedInProfileResult Failed(string error) =>
      new() { Success = false, Error = error };
}

/// <summary>
/// Interface for LinkedIn OAuth 2.0 service
/// </summary>
public interface ILinkedInService
{
  /// <summary>
  /// Generate OAuth 2.0 authorization URL for LinkedIn
  /// </summary>
  string GetAuthorizationUrl(string state, string redirectUri);

  /// <summary>
  /// Exchange authorization code for access and refresh tokens
  /// </summary>
  Task<LinkedInTokenResult> ExchangeCodeForTokensAsync(string code, string redirectUri, CancellationToken cancellationToken = default);

  /// <summary>
  /// Refresh an expired access token using the refresh token
  /// </summary>
  Task<LinkedInTokenResult> RefreshAccessTokenAsync(string refreshToken, CancellationToken cancellationToken = default);

  /// <summary>
  /// Revoke access (disconnect LinkedIn)
  /// </summary>
  Task<bool> RevokeAccessAsync(string accessToken, CancellationToken cancellationToken = default);

  /// <summary>
  /// Get basic profile info (id, name, email)
  /// </summary>
  Task<LinkedInProfileResult> GetBasicProfileAsync(string accessToken, CancellationToken cancellationToken = default);

  /// <summary>
  /// Get full profile with positions and educations
  /// Note: Requires appropriate API permissions
  /// </summary>
  Task<LinkedInProfileResult> GetFullProfileAsync(string accessToken, CancellationToken cancellationToken = default);
}
