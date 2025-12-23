using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace NotificationService.Domain.Entities;

/// <summary>
/// User reminder settings for appointments
/// </summary>
public class ReminderSettings : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Minutes before appointment to send reminders (e.g., "5,15,60,1440" for 5min, 15min, 1h, 1day)
    /// </summary>
    [MaxLength(100)]
    public string ReminderMinutesBefore { get; set; } = "15,60"; // Default: 15min, 1h

    public bool EmailRemindersEnabled { get; set; } = true;
    public bool PushRemindersEnabled { get; set; } = true;
    public bool SmsRemindersEnabled { get; set; } = false;

    /// <summary>
    /// Get reminder times as integer array
    /// </summary>
    public int[] GetReminderMinutes()
    {
        if (string.IsNullOrEmpty(ReminderMinutesBefore))
            return Array.Empty<int>();

        return ReminderMinutesBefore
            .Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(s => int.TryParse(s.Trim(), out var n) ? n : 0)
            .Where(n => n > 0)
            .OrderBy(n => n)
            .ToArray();
    }

    /// <summary>
    /// Set reminder times from integer array
    /// </summary>
    public void SetReminderMinutes(int[] minutes)
    {
        ReminderMinutesBefore = string.Join(",", minutes.OrderBy(m => m));
    }
}
