using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace NotificationService.Domain.Entities;

/// <summary>
/// User notification preferences
/// </summary>
public class NotificationPreferences : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    // Email preferences
    public bool EmailEnabled { get; set; } = true;
    public bool EmailMarketing { get; set; } = true;
    public bool EmailSecurity { get; set; } = true;
    public bool EmailUpdates { get; set; } = true;
    public bool EmailReminders { get; set; } = true;
    public bool EmailDigestEnabled { get; set; } = false;

    // SMS preferences
    public bool SmsEnabled { get; set; } = false;
    public bool SmsSecurity { get; set; } = false;
    public bool SmsReminders { get; set; } = false;

    // Push notification preferences
    public bool PushEnabled { get; set; } = true;
    public bool PushMarketing { get; set; } = false;
    public bool PushSecurity { get; set; } = true;
    public bool PushUpdates { get; set; } = true;
    public bool PushReminders { get; set; } = true;
    public string? PushToken { get; set; } // Device token for push notifications

    // Quiet hours
    public TimeOnly? QuietHoursStart { get; set; }
    public TimeOnly? QuietHoursEnd { get; set; }

    [MaxLength(100)]
    public string TimeZone { get; set; } = "UTC";

    // Frequency settings
    [MaxLength(50)]
    public string DigestFrequency { get; set; } = "Daily"; // Immediate, Daily, Weekly, Never
    public int DigestHour { get; set; } = 18; // Hour of day (0-23) to send digest

    // Language preference
    [MaxLength(10)]
    public string Language { get; set; } = "en";
    
    // Timezone property (alias for TimeZone for compatibility)
    public string Timezone => TimeZone;
}
