using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace UserService.Domain.Models;

/// <summary>
/// User login tracking and security (Phase 4 - extracted from User)
/// One-to-one relationship with User for current state
/// </summary>
public class UserLoginHistory : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    // =============================================
    // Last Login Information
    // =============================================

    /// <summary>
    /// When the user last logged in successfully
    /// </summary>
    public DateTime? LastLoginAt { get; set; }

    /// <summary>
    /// IP address of last successful login
    /// </summary>
    [MaxLength(45)]
    public string? LastLoginIp { get; set; }

    /// <summary>
    /// User agent of last successful login
    /// </summary>
    [MaxLength(500)]
    public string? LastLoginUserAgent { get; set; }

    /// <summary>
    /// Country/region of last login (from IP geolocation)
    /// </summary>
    [MaxLength(100)]
    public string? LastLoginLocation { get; set; }

    /// <summary>
    /// Device type of last login (desktop, mobile, tablet)
    /// </summary>
    [MaxLength(50)]
    public string? LastLoginDeviceType { get; set; }

    // =============================================
    // Failed Login Tracking
    // =============================================

    /// <summary>
    /// Number of consecutive failed login attempts
    /// </summary>
    public int FailedLoginAttempts { get; set; } = 0;

    /// <summary>
    /// When the last failed login attempt occurred
    /// </summary>
    public DateTime? LastFailedLoginAt { get; set; }

    /// <summary>
    /// IP address of last failed login
    /// </summary>
    [MaxLength(45)]
    public string? LastFailedLoginIp { get; set; }

    // =============================================
    // Account Lockout
    // =============================================

    /// <summary>
    /// When the account is locked until (null if not locked)
    /// </summary>
    public DateTime? AccountLockedUntil { get; set; }

    /// <summary>
    /// Reason for account lockout
    /// </summary>
    [MaxLength(500)]
    public string? LockoutReason { get; set; }

    /// <summary>
    /// Total number of times account has been locked
    /// </summary>
    public int TotalLockoutCount { get; set; } = 0;

    // =============================================
    // Statistics
    // =============================================

    /// <summary>
    /// Total successful logins
    /// </summary>
    public int TotalSuccessfulLogins { get; set; } = 0;

    /// <summary>
    /// Total failed login attempts (lifetime)
    /// </summary>
    public int TotalFailedLogins { get; set; } = 0;

    // =============================================
    // Navigation
    // =============================================

    public virtual User User { get; set; } = null!;

    // =============================================
    // Factory & Helper Methods
    // =============================================

    public static UserLoginHistory CreateForUser(string userId)
    {
        return new UserLoginHistory
        {
            UserId = userId
        };
    }

    /// <summary>
    /// Check if account is currently locked
    /// </summary>
    public bool IsLocked => AccountLockedUntil.HasValue && AccountLockedUntil > DateTime.UtcNow;

    /// <summary>
    /// Record a successful login
    /// </summary>
    public void RecordSuccessfulLogin(string? ipAddress, string? userAgent = null, string? location = null, string? deviceType = null)
    {
        LastLoginAt = DateTime.UtcNow;
        LastLoginIp = ipAddress;
        LastLoginUserAgent = userAgent;
        LastLoginLocation = location;
        LastLoginDeviceType = deviceType;
        FailedLoginAttempts = 0; // Reset on successful login
        TotalSuccessfulLogins++;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Record a failed login attempt
    /// </summary>
    public void RecordFailedLogin(string? ipAddress)
    {
        FailedLoginAttempts++;
        TotalFailedLogins++;
        LastFailedLoginAt = DateTime.UtcNow;
        LastFailedLoginIp = ipAddress;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Lock the account for a specified duration
    /// </summary>
    public void LockAccount(TimeSpan duration, string? reason = null)
    {
        AccountLockedUntil = DateTime.UtcNow.Add(duration);
        LockoutReason = reason ?? "Too many failed login attempts";
        TotalLockoutCount++;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Unlock the account
    /// </summary>
    public void UnlockAccount()
    {
        AccountLockedUntil = null;
        LockoutReason = null;
        FailedLoginAttempts = 0;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Check if account should be locked based on failed attempts
    /// </summary>
    public bool ShouldLockAccount(int maxAttempts = 5)
    {
        return FailedLoginAttempts >= maxAttempts;
    }
}
