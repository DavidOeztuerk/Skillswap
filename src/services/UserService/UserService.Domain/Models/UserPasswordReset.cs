using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace UserService.Domain.Models;

/// <summary>
/// User password reset tracking (Phase 4 - extracted from User)
/// One-to-one relationship with User
/// </summary>
public class UserPasswordReset : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    // =============================================
    // Current Reset Token
    // =============================================

    /// <summary>
    /// Current password reset token
    /// </summary>
    [MaxLength(100)]
    public string? ResetToken { get; set; }

    /// <summary>
    /// When the reset token expires
    /// </summary>
    public DateTime? ResetTokenExpiresAt { get; set; }

    /// <summary>
    /// When the reset token was created
    /// </summary>
    public DateTime? ResetTokenCreatedAt { get; set; }

    /// <summary>
    /// IP address that requested the reset
    /// </summary>
    [MaxLength(45)]
    public string? ResetRequestedFromIp { get; set; }

    // =============================================
    // Password Change History
    // =============================================

    /// <summary>
    /// When password was last changed
    /// </summary>
    public DateTime? PasswordChangedAt { get; set; }

    /// <summary>
    /// IP address from which password was last changed
    /// </summary>
    [MaxLength(45)]
    public string? PasswordChangedFromIp { get; set; }

    /// <summary>
    /// Total number of password changes
    /// </summary>
    public int TotalPasswordChanges { get; set; } = 0;

    // =============================================
    // Rate Limiting
    // =============================================

    /// <summary>
    /// Number of reset requests in current period
    /// </summary>
    public int ResetRequestCount { get; set; } = 0;

    /// <summary>
    /// When the reset request count resets
    /// </summary>
    public DateTime? ResetRequestCountResetAt { get; set; }

    /// <summary>
    /// Cooldown until next reset request can be made
    /// </summary>
    public DateTime? ResetCooldownUntil { get; set; }

    // =============================================
    // Navigation
    // =============================================

    public virtual User User { get; set; } = null!;

    // =============================================
    // Factory & Helper Methods
    // =============================================

    public static UserPasswordReset CreateForUser(string userId)
    {
        return new UserPasswordReset
        {
            UserId = userId
        };
    }

    /// <summary>
    /// Check if there's an active reset token
    /// </summary>
    public bool HasActiveResetToken =>
        !string.IsNullOrEmpty(ResetToken) &&
        ResetTokenExpiresAt.HasValue &&
        ResetTokenExpiresAt > DateTime.UtcNow;

    /// <summary>
    /// Check if user can request a password reset
    /// </summary>
    public bool CanRequestReset()
    {
        return !ResetCooldownUntil.HasValue || ResetCooldownUntil <= DateTime.UtcNow;
    }

    /// <summary>
    /// Generate a new password reset token
    /// </summary>
    public string GenerateResetToken(TimeSpan tokenLifetime, TimeSpan cooldownPeriod, string? requestIp = null)
    {
        ResetToken = Guid.NewGuid().ToString("N");
        ResetTokenExpiresAt = DateTime.UtcNow.Add(tokenLifetime);
        ResetTokenCreatedAt = DateTime.UtcNow;
        ResetRequestedFromIp = requestIp;
        ResetCooldownUntil = DateTime.UtcNow.Add(cooldownPeriod);

        // Track request count (reset every 24 hours)
        if (!ResetRequestCountResetAt.HasValue || ResetRequestCountResetAt <= DateTime.UtcNow)
        {
            ResetRequestCount = 1;
            ResetRequestCountResetAt = DateTime.UtcNow.AddHours(24);
        }
        else
        {
            ResetRequestCount++;
        }

        UpdatedAt = DateTime.UtcNow;
        return ResetToken;
    }

    /// <summary>
    /// Validate a reset token
    /// </summary>
    public bool ValidateToken(string token)
    {
        return ResetToken == token &&
               ResetTokenExpiresAt.HasValue &&
               ResetTokenExpiresAt > DateTime.UtcNow;
    }

    /// <summary>
    /// Mark password as changed (invalidates reset token)
    /// </summary>
    public void MarkPasswordChanged(string? changedFromIp = null)
    {
        ResetToken = null;
        ResetTokenExpiresAt = null;
        PasswordChangedAt = DateTime.UtcNow;
        PasswordChangedFromIp = changedFromIp;
        TotalPasswordChanges++;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Invalidate the current reset token without changing password
    /// </summary>
    public void InvalidateToken()
    {
        ResetToken = null;
        ResetTokenExpiresAt = null;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Check if too many reset requests have been made
    /// </summary>
    public bool HasExceededResetLimit(int maxRequestsPerDay = 5)
    {
        if (!ResetRequestCountResetAt.HasValue || ResetRequestCountResetAt <= DateTime.UtcNow)
        {
            return false;
        }
        return ResetRequestCount >= maxRequestsPerDay;
    }
}
