using Domain.Abstractions;
using System.ComponentModel.DataAnnotations;

namespace UserService.Domain.Models;

/// <summary>
/// Represents a user's connection to LinkedIn for profile import and verification
/// Phase 12 - LinkedIn/Xing Integration
/// </summary>
public class UserLinkedInConnection : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// LinkedIn member ID (unique identifier from LinkedIn)
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string LinkedInId { get; set; } = string.Empty;

    /// <summary>
    /// Encrypted OAuth 2.0 access token
    /// </summary>
    [Required]
    public string AccessToken { get; set; } = string.Empty;

    /// <summary>
    /// Encrypted OAuth 2.0 refresh token (if available)
    /// </summary>
    public string? RefreshToken { get; set; }

    /// <summary>
    /// When the access token expires
    /// </summary>
    public DateTime TokenExpiresAt { get; set; }

    /// <summary>
    /// LinkedIn profile URL
    /// </summary>
    [MaxLength(500)]
    public string? ProfileUrl { get; set; }

    /// <summary>
    /// Email from LinkedIn (if permission granted)
    /// </summary>
    [MaxLength(256)]
    public string? LinkedInEmail { get; set; }

    /// <summary>
    /// Last time profile was synced from LinkedIn
    /// </summary>
    public DateTime? LastSyncAt { get; set; }

    /// <summary>
    /// Number of successful syncs
    /// </summary>
    public int SyncCount { get; set; } = 0;

    /// <summary>
    /// Last sync error message if any
    /// </summary>
    [MaxLength(1000)]
    public string? LastSyncError { get; set; }

    /// <summary>
    /// Whether profile is verified via LinkedIn
    /// </summary>
    public bool IsVerified { get; set; } = false;

    /// <summary>
    /// When the profile was verified
    /// </summary>
    public DateTime? VerifiedAt { get; set; }

    /// <summary>
    /// Number of experiences imported from LinkedIn
    /// </summary>
    public int ImportedExperienceCount { get; set; } = 0;

    /// <summary>
    /// Number of educations imported from LinkedIn
    /// </summary>
    public int ImportedEducationCount { get; set; } = 0;

    /// <summary>
    /// Whether auto-sync is enabled
    /// </summary>
    public bool AutoSyncEnabled { get; set; } = false;

    // Navigation property
    public virtual User? User { get; set; }

    // Helper methods
    public bool IsTokenExpired() => TokenExpiresAt <= DateTime.UtcNow;

    public bool NeedsRefresh() => TokenExpiresAt <= DateTime.UtcNow.AddMinutes(5);

    public void MarkSyncSuccess(int experienceCount = 0, int educationCount = 0)
    {
        LastSyncAt = DateTime.UtcNow;
        SyncCount++;
        LastSyncError = null;
        ImportedExperienceCount = experienceCount;
        ImportedEducationCount = educationCount;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkSyncError(string error)
    {
        LastSyncError = error;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateTokens(string accessToken, string? refreshToken, DateTime expiresAt)
    {
        AccessToken = accessToken;
        RefreshToken = refreshToken;
        TokenExpiresAt = expiresAt;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkVerified()
    {
        IsVerified = true;
        VerifiedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public static UserLinkedInConnection Create(
        string userId,
        string linkedInId,
        string accessToken,
        string? refreshToken,
        DateTime tokenExpiresAt,
        string? profileUrl = null,
        string? linkedInEmail = null)
    {
        return new UserLinkedInConnection
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            LinkedInId = linkedInId,
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            TokenExpiresAt = tokenExpiresAt,
            ProfileUrl = profileUrl,
            LinkedInEmail = linkedInEmail,
            IsVerified = true, // Connected = verified
            VerifiedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
    }
}
