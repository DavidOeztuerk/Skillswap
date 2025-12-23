using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace NotificationService.Domain.Entities;

/// <summary>
/// Scheduled reminder for an appointment
/// </summary>
public class ScheduledReminder : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string AppointmentId { get; set; } = string.Empty;

    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Type of reminder: Email, Push, SMS
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string ReminderType { get; set; } = "Email";

    /// <summary>
    /// When the reminder should be sent
    /// </summary>
    public DateTime ScheduledFor { get; set; }

    /// <summary>
    /// How many minutes before the appointment
    /// </summary>
    public int MinutesBefore { get; set; }

    /// <summary>
    /// Status: Pending, Sent, Cancelled, Failed
    /// </summary>
    [MaxLength(50)]
    public string Status { get; set; } = "Pending";

    /// <summary>
    /// When the reminder was actually sent
    /// </summary>
    public DateTime? SentAt { get; set; }

    /// <summary>
    /// Error message if sending failed
    /// </summary>
    [MaxLength(1000)]
    public string? ErrorMessage { get; set; }

    // Additional context for the reminder
    [MaxLength(200)]
    public string? PartnerName { get; set; }

    [MaxLength(200)]
    public string? SkillName { get; set; }

    [MaxLength(500)]
    public string? MeetingLink { get; set; }

    public DateTime? AppointmentTime { get; set; }
}
