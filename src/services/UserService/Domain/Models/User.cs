using Infrastructure.Models;
using System.ComponentModel.DataAnnotations;

namespace UserService.Domain.Models;

/// <summary>
/// Enhanced User entity with comprehensive properties
/// </summary>
public class User : AuditableEntity
{
    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [MaxLength(1000)]
    public string? Bio { get; set; }

    [MaxLength(100)]
    public string? TimeZone { get; set; }

    [MaxLength(20)]
    public string AccountStatus { get; set; } = "PendingVerification";

    public bool EmailVerified { get; set; } = false;
    public bool PhoneVerified { get; set; } = false;
    public bool TwoFactorEnabled { get; set; } = false;

    [MaxLength(100)]
    public string? TwoFactorSecret { get; set; }

    // Email verification
    [MaxLength(100)]
    public string? EmailVerificationToken { get; set; }
    public DateTime? EmailVerificationTokenExpiresAt { get; set; }

    // Password reset
    [MaxLength(100)]
    public string? PasswordResetToken { get; set; }
    public DateTime? PasswordResetTokenExpiresAt { get; set; }
    public DateTime? PasswordChangedAt { get; set; }

    // Login tracking
    public DateTime? LastLoginAt { get; set; }
    [MaxLength(45)]
    public string? LastLoginIp { get; set; }
    public int FailedLoginAttempts { get; set; } = 0;
    public DateTime? AccountLockedUntil { get; set; }

    // Profile picture
    [MaxLength(500)]
    public string? ProfilePictureUrl { get; set; }

    // Preferences (stored as JSON)
    public string? PreferencesJson { get; set; }

    // Navigation properties
    public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public virtual ICollection<UserActivity> Activities { get; set; } = new List<UserActivity>();
    public virtual ICollection<UserSession> Sessions { get; set; } = new List<UserSession>();

    // Computed properties
    public string FullName => $"{FirstName} {LastName}".Trim();
    public bool IsAccountLocked => AccountLockedUntil.HasValue && AccountLockedUntil > DateTime.UtcNow;
    public bool IsActive => AccountStatus == "Active" && !IsAccountLocked && !IsDeleted;

    // Helper methods
    public void LockAccount(TimeSpan lockDuration, string reason)
    {
        AccountLockedUntil = DateTime.UtcNow.Add(lockDuration);
        FailedLoginAttempts++;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UnlockAccount()
    {
        AccountLockedUntil = null;
        FailedLoginAttempts = 0;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkEmailAsVerified()
    {
        EmailVerified = true;
        EmailVerificationToken = null;
        EmailVerificationTokenExpiresAt = null;
        if (AccountStatus == "PendingVerification")
        {
            AccountStatus = "Active";
        }
        UpdatedAt = DateTime.UtcNow;
    }
}
