using Domain.Abstractions;
using System.ComponentModel.DataAnnotations;

namespace UserService.Domain.Models;

/// <summary>
/// Represents a user's connection to Xing for profile import and verification
/// Phase 12 - LinkedIn/Xing Integration
/// Note: Xing uses OAuth 1.0a which requires token + secret
/// </summary>
public class UserXingConnection : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Xing user ID (unique identifier from Xing)
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string XingId { get; set; } = string.Empty;

    /// <summary>
    /// Encrypted OAuth 1.0a access token
    /// </summary>
    [Required]
    public string AccessToken { get; set; } = string.Empty;

    /// <summary>
    /// Encrypted OAuth 1.0a token secret (required for OAuth 1.0a)
    /// </summary>
    [Required]
    public string TokenSecret { get; set; } = string.Empty;

    /// <summary>
    /// Xing profile URL (permalink)
    /// </summary>
    [MaxLength(500)]
    public string? ProfileUrl { get; set; }

    /// <summary>
    /// Email from Xing (if permission granted)
    /// </summary>
    [MaxLength(256)]
    public string? XingEmail { get; set; }

    /// <summary>
    /// Last time profile was synced from Xing
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
    /// Whether profile is verified via Xing
    /// </summary>
    public bool IsVerified { get; set; } = false;

    /// <summary>
    /// When the profile was verified
    /// </summary>
    public DateTime? VerifiedAt { get; set; }

    /// <summary>
    /// Number of experiences imported from Xing
    /// </summary>
    public int ImportedExperienceCount { get; set; } = 0;

    /// <summary>
    /// Number of educations imported from Xing
    /// </summary>
    public int ImportedEducationCount { get; set; } = 0;

    /// <summary>
    /// Whether auto-sync is enabled
    /// </summary>
    public bool AutoSyncEnabled { get; set; } = false;

    // Navigation property
    public virtual User? User { get; set; }

    // Helper methods
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

    public void UpdateTokens(string accessToken, string tokenSecret)
    {
        AccessToken = accessToken;
        TokenSecret = tokenSecret;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkVerified()
    {
        IsVerified = true;
        VerifiedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public static UserXingConnection Create(
        string userId,
        string xingId,
        string accessToken,
        string tokenSecret,
        string? profileUrl = null,
        string? xingEmail = null)
    {
        return new UserXingConnection
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            XingId = xingId,
            AccessToken = accessToken,
            TokenSecret = tokenSecret,
            ProfileUrl = profileUrl,
            XingEmail = xingEmail,
            IsVerified = true, // Connected = verified
            VerifiedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
    }
}
