using System.ComponentModel.DataAnnotations;
using Infrastructure.Models;

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

    // SMS preferences
    public bool SmsEnabled { get; set; } = false;
    public bool SmsSecurity { get; set; } = false;
    public bool SmsReminders { get; set; } = false;

    // Push notification preferences
    public bool PushEnabled { get; set; } = true;
    public bool PushMarketing { get; set; } = false;
    public bool PushSecurity { get; set; } = true;
    public bool PushUpdates { get; set; } = true;

    // Quiet hours
    public TimeOnly? QuietHoursStart { get; set; }
    public TimeOnly? QuietHoursEnd { get; set; }

    [MaxLength(100)]
    public string TimeZone { get; set; } = "UTC";

    // Frequency settings
    [MaxLength(50)]
    public string DigestFrequency { get; set; } = "Daily"; // Immediate, Daily, Weekly, Never

    // Language preference
    [MaxLength(10)]
    public string Language { get; set; } = "en";
}
