using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace UserService.Domain.Models;

/// <summary>
/// User verification data - email, phone, and 2FA (Phase 4 - extracted from User)
/// One-to-one relationship with User
/// </summary>
public class UserVerification : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    // =============================================
    // Two-Factor Authentication
    // =============================================

    /// <summary>
    /// Whether 2FA is enabled for this user
    /// </summary>
    public bool TwoFactorEnabled { get; set; } = false;

    /// <summary>
    /// TOTP secret for 2FA (encrypted)
    /// </summary>
    [MaxLength(100)]
    public string? TwoFactorSecret { get; set; }

    /// <summary>
    /// Backup codes for 2FA recovery (JSON array, encrypted)
    /// </summary>
    public string? TwoFactorBackupCodesJson { get; set; }

    /// <summary>
    /// When 2FA was enabled
    /// </summary>
    public DateTime? TwoFactorEnabledAt { get; set; }

    // =============================================
    // Email Verification
    // =============================================

    /// <summary>
    /// Current email verification token
    /// </summary>
    [MaxLength(100)]
    public string? EmailVerificationToken { get; set; }

    /// <summary>
    /// When the email verification token expires
    /// </summary>
    public DateTime? EmailVerificationTokenExpiresAt { get; set; }

    /// <summary>
    /// When the last verification email was sent
    /// </summary>
    public DateTime? EmailVerificationSentAt { get; set; }

    /// <summary>
    /// Cooldown until next verification email can be sent
    /// </summary>
    public DateTime? EmailVerificationCooldownUntil { get; set; }

    /// <summary>
    /// Number of verification attempts
    /// </summary>
    public int EmailVerificationAttempts { get; set; } = 0;

    /// <summary>
    /// When email was verified
    /// </summary>
    public DateTime? EmailVerifiedAt { get; set; }

    // =============================================
    // Phone Verification
    // =============================================

    /// <summary>
    /// Current phone verification code
    /// </summary>
    [MaxLength(100)]
    public string? PhoneVerificationCode { get; set; }

    /// <summary>
    /// When the phone verification code expires
    /// </summary>
    public DateTime? PhoneVerificationExpiresAt { get; set; }

    /// <summary>
    /// When the last verification SMS was sent
    /// </summary>
    public DateTime? PhoneVerificationSentAt { get; set; }

    /// <summary>
    /// Cooldown until next verification SMS can be sent
    /// </summary>
    public DateTime? PhoneVerificationCooldownUntil { get; set; }

    /// <summary>
    /// Number of verification SMS sent
    /// </summary>
    public int PhoneVerificationAttempts { get; set; } = 0;

    /// <summary>
    /// Number of failed verification attempts
    /// </summary>
    public int PhoneVerificationFailedAttempts { get; set; } = 0;

    /// <summary>
    /// When phone was verified
    /// </summary>
    public DateTime? PhoneVerifiedAt { get; set; }

    // =============================================
    // Navigation
    // =============================================

    public virtual User User { get; set; } = null!;

    // =============================================
    // Factory & Helper Methods
    // =============================================

    public static UserVerification CreateForUser(string userId)
    {
        return new UserVerification
        {
            UserId = userId
        };
    }

    public void GenerateEmailVerificationToken(TimeSpan tokenLifetime, TimeSpan cooldownPeriod)
    {
        EmailVerificationToken = Guid.NewGuid().ToString("N");
        EmailVerificationTokenExpiresAt = DateTime.UtcNow.Add(tokenLifetime);
        EmailVerificationSentAt = DateTime.UtcNow;
        EmailVerificationCooldownUntil = DateTime.UtcNow.Add(cooldownPeriod);
        EmailVerificationAttempts++;
    }

    public bool CanSendEmailVerification()
    {
        return !EmailVerificationCooldownUntil.HasValue ||
               EmailVerificationCooldownUntil <= DateTime.UtcNow;
    }

    public bool ValidateEmailToken(string token)
    {
        return EmailVerificationToken == token &&
               EmailVerificationTokenExpiresAt.HasValue &&
               EmailVerificationTokenExpiresAt > DateTime.UtcNow;
    }

    public void MarkEmailVerified()
    {
        EmailVerifiedAt = DateTime.UtcNow;
        EmailVerificationToken = null;
        EmailVerificationTokenExpiresAt = null;
    }

    public void GeneratePhoneVerificationCode(TimeSpan codeLifetime, TimeSpan cooldownPeriod)
    {
        // Generate 6-digit code
        PhoneVerificationCode = Random.Shared.Next(100000, 999999).ToString();
        PhoneVerificationExpiresAt = DateTime.UtcNow.Add(codeLifetime);
        PhoneVerificationSentAt = DateTime.UtcNow;
        PhoneVerificationCooldownUntil = DateTime.UtcNow.Add(cooldownPeriod);
        PhoneVerificationAttempts++;
    }

    public bool CanSendPhoneVerification()
    {
        return !PhoneVerificationCooldownUntil.HasValue ||
               PhoneVerificationCooldownUntil <= DateTime.UtcNow;
    }

    public bool ValidatePhoneCode(string code)
    {
        if (PhoneVerificationCode != code)
        {
            PhoneVerificationFailedAttempts++;
            return false;
        }

        if (!PhoneVerificationExpiresAt.HasValue || PhoneVerificationExpiresAt <= DateTime.UtcNow)
        {
            return false;
        }

        return true;
    }

    public void MarkPhoneVerified()
    {
        PhoneVerifiedAt = DateTime.UtcNow;
        PhoneVerificationCode = null;
        PhoneVerificationExpiresAt = null;
        PhoneVerificationFailedAttempts = 0;
    }

    public void Enable2FA(string secret)
    {
        TwoFactorEnabled = true;
        TwoFactorSecret = secret;
        TwoFactorEnabledAt = DateTime.UtcNow;
    }

    public void Disable2FA()
    {
        TwoFactorEnabled = false;
        TwoFactorSecret = null;
        TwoFactorBackupCodesJson = null;
        TwoFactorEnabledAt = null;
    }
}
