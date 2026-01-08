using Domain.Abstractions;
using System.ComponentModel.DataAnnotations;
using UserService.Domain.Enums;

namespace UserService.Domain.Models;

/// <summary>
/// Enhanced User entity with comprehensive properties
/// </summary>
public class User : AuditableEntity
{
    [Required]
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

    [Required]
    [MaxLength(100)]
    public string UserName { get; set; } = string.Empty;

    [MaxLength(20)]
    public string PhoneNumber { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Bio { get; set; }

    [MaxLength(200)]
    public string? Headline { get; set; }

    [MaxLength(100)]
    public string? TimeZone { get; set; }

    public AccountStatus AccountStatus { get; set; } = AccountStatus.PendingVerification;

    public bool EmailVerified { get; set; } = false;
    public bool PhoneVerified { get; set; } = false;
    public bool TwoFactorEnabled { get; set; } = false;

    [MaxLength(100)]
    public string? TwoFactorSecret { get; set; }

    // Email verification
    [MaxLength(100)]
    public string? EmailVerificationToken { get; set; }
    public DateTime? EmailVerificationTokenExpiresAt { get; set; }
    public DateTime? EmailVerificationSentAt { get; set; }
    public DateTime? EmailVerificationCooldownUntil { get; set; }
    public int EmailVerificationAttempts { get; set; } = 0;

    // Phone verification
    [MaxLength(100)]
    public string? PhoneVerificationCode { get; set; }
    public DateTime? PhoneVerificationExpiresAt { get; set; }
    public DateTime? PhoneVerificationSentAt { get; set; }
    public DateTime? PhoneVerificationCooldownUntil { get; set; }
    public int PhoneVerificationAttempts { get; set; } = 0;
    public int PhoneVerificationFailedAttempts { get; set; } = 0;
    public DateTime? PhoneVerifiedAt { get; set; }

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

    // Admin fields
    public bool IsSuspended { get; set; } = false;
    public DateTime? SuspendedAt { get; set; }
    public string? SuspensionReason { get; set; }

    // TODO: Avatar wird später über Firebase Storage URL gespeichert
    // Upload ist im Frontend deaktiviert bis Firebase Storage implementiert ist
    public string? ProfilePictureUrl { get; set; }

    // Availability and scheduling (stored as JSON)
    public string? AvailabilityJson { get; set; }
    public string? BlockedDatesJson { get; set; }

    // Notification preferences (stored as JSON)
    public string? NotificationPreferencesJson { get; set; }

    // Preferences (stored as JSON)
    public string? PreferencesJson { get; set; }

    // Navigation properties
    public virtual ICollection<UserRole> UserRoles { get; set; } = [];
    public virtual ICollection<UserPermission> UserPermissions { get; set; } = [];
    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = [];
    public virtual ICollection<UserActivity> Activities { get; set; } = [];
    public virtual ICollection<UserSession> Sessions { get; set; } = [];
    public virtual ICollection<BlockedUser> BlockedUsersInitiated { get; set; } = [];
    public virtual ICollection<BlockedUser> BlockedByOthers { get; set; } = [];

    // Profile extension collections
    public virtual ICollection<UserExperience> Experiences { get; set; } = [];
    public virtual ICollection<UserEducation> Education { get; set; } = [];

    // Reviews - given and received
    public virtual ICollection<UserReview> ReviewsGiven { get; set; } = [];
    public virtual ICollection<UserReview> ReviewsReceived { get; set; } = [];

    // Phase 3: Tables replacing JSON fields
    public virtual ICollection<UserAvailability> Availabilities { get; set; } = [];
    public virtual ICollection<UserBlockedDate> BlockedDates { get; set; } = [];
    public virtual UserPreferenceEntity? Preferences { get; set; }
    public virtual UserNotificationPreference? NotificationPreferences { get; set; };

    // Phase 4: Split User entity into focused entities
    public virtual UserVerification? Verification { get; set; }
    public virtual UserLoginHistory? LoginHistory { get; set; }
    public virtual UserPasswordReset? PasswordReset { get; set; }

    // Phase 5: Denormalized statistics for performance
    public virtual UserStatistics? Statistics { get; set; }

    // Phase 12: LinkedIn/Xing integration
    public virtual UserLinkedInConnection? LinkedInConnection { get; set; }
    public virtual UserXingConnection? XingConnection { get; set; }

    // Computed properties
    public string FullName => $"{FirstName} {LastName}".Trim();
    public bool IsAccountLocked => AccountLockedUntil.HasValue && AccountLockedUntil > DateTime.UtcNow;
    public bool IsActive => AccountStatus == AccountStatus.Active && !IsAccountLocked && !IsDeleted;

    // Helper methods
    public void LockAccount(TimeSpan lockDuration, string reason)
    {
        AccountLockedUntil = DateTime.UtcNow.Add(lockDuration);
        FailedLoginAttempts++;
        UpdatedAt = DateTime.UtcNow;
        AccountStatus = AccountStatus.Suspended;
    }

    public void UnlockAccount()
    {
        AccountLockedUntil = null;
        FailedLoginAttempts = 0;
        UpdatedAt = DateTime.UtcNow;
        AccountStatus = AccountStatus.Active;
    }

    public void MarkEmailAsVerified()
    {
        EmailVerified = true;
        EmailVerificationToken = null;
        EmailVerificationTokenExpiresAt = null;
        if (AccountStatus == AccountStatus.PendingVerification)
        {
            AccountStatus = AccountStatus.Active;
        }
        UpdatedAt = DateTime.UtcNow;
    }
}
