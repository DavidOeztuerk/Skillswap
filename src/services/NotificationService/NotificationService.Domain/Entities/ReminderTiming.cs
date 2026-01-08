using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace NotificationService.Domain.Entities;

/// <summary>
/// Reminder timing entity (replaces ReminderSettings.ReminderMinutesBefore CSV)
/// </summary>
public class ReminderTiming : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string ReminderSettingsId { get; set; } = string.Empty;

    /// <summary>
    /// Minutes before appointment to send reminder
    /// </summary>
    [Required]
    public int MinutesBefore { get; set; }

    /// <summary>
    /// Sort order for display
    /// </summary>
    public int SortOrder { get; set; } = 0;

    /// <summary>
    /// Whether this timing is enabled
    /// </summary>
    public bool IsEnabled { get; set; } = true;

    // Navigation
    public virtual ReminderSettings ReminderSettings { get; set; } = null!;

    // Factory method
    public static ReminderTiming Create(string reminderSettingsId, int minutesBefore, int sortOrder = 0)
    {
        return new ReminderTiming
        {
            ReminderSettingsId = reminderSettingsId,
            MinutesBefore = minutesBefore,
            SortOrder = sortOrder,
            IsEnabled = true
        };
    }

    // Common timing presets
    public static class CommonTimings
    {
        public const int FiveMinutes = 5;
        public const int FifteenMinutes = 15;
        public const int ThirtyMinutes = 30;
        public const int OneHour = 60;
        public const int TwoHours = 120;
        public const int OneDay = 1440;
        public const int TwoDays = 2880;
    }
}
