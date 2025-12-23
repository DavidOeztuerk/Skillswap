using Domain.Abstractions;
using System.ComponentModel.DataAnnotations;

namespace UserService.Domain.Models;

/// <summary>
/// Represents a user's connection to an external calendar provider (Google, Microsoft, Apple)
/// </summary>
public class UserCalendarConnection : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Provider { get; set; } = string.Empty; // 'Google', 'Microsoft', 'Apple'

    /// <summary>
    /// Encrypted OAuth access token
    /// </summary>
    [Required]
    public string AccessToken { get; set; } = string.Empty;

    /// <summary>
    /// Encrypted OAuth refresh token
    /// </summary>
    [Required]
    public string RefreshToken { get; set; } = string.Empty;

    /// <summary>
    /// When the access token expires
    /// </summary>
    public DateTime TokenExpiresAt { get; set; }

    /// <summary>
    /// The calendar ID to sync appointments to (e.g., 'primary' for Google)
    /// </summary>
    [MaxLength(450)]
    public string? CalendarId { get; set; }

    /// <summary>
    /// User's email from the calendar provider
    /// </summary>
    [MaxLength(256)]
    public string? ProviderEmail { get; set; }

    /// <summary>
    /// Whether automatic sync is enabled
    /// </summary>
    public bool SyncEnabled { get; set; } = true;

    /// <summary>
    /// Last time appointments were synced
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

    // Navigation property
    public virtual User? User { get; set; }

    // Helper methods
    public bool IsTokenExpired() => TokenExpiresAt <= DateTime.UtcNow;

    public bool NeedsRefresh() => TokenExpiresAt <= DateTime.UtcNow.AddMinutes(5);

    public void MarkSyncSuccess()
    {
        LastSyncAt = DateTime.UtcNow;
        SyncCount++;
        LastSyncError = null;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkSyncError(string error)
    {
        LastSyncError = error;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateTokens(string accessToken, string refreshToken, DateTime expiresAt)
    {
        AccessToken = accessToken;
        RefreshToken = refreshToken;
        TokenExpiresAt = expiresAt;
        UpdatedAt = DateTime.UtcNow;
    }
}

/// <summary>
/// Supported calendar providers
/// </summary>
public static class CalendarProviders
{
    public const string Google = "Google";
    public const string Microsoft = "Microsoft";
    public const string Apple = "Apple";

    public static readonly string[] All = [Google, Microsoft, Apple];

    /// <summary>
    /// Providers that use OAuth 2.0 flow
    /// </summary>
    public static readonly string[] OAuthProviders = [Google, Microsoft];

    /// <summary>
    /// Providers that use CalDAV protocol (username/app-specific password)
    /// </summary>
    public static readonly string[] CalDavProviders = [Apple];

    public static bool IsValid(string provider) => All.Contains(provider, StringComparer.OrdinalIgnoreCase);

    public static bool IsOAuthProvider(string provider) => OAuthProviders.Contains(provider, StringComparer.OrdinalIgnoreCase);

    public static bool IsCalDavProvider(string provider) => CalDavProviders.Contains(provider, StringComparer.OrdinalIgnoreCase);
}
