using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace UserService.Domain.Models;

/// <summary>
/// User notification preferences (replaces User.NotificationPreferencesJson)
/// </summary>
public class UserNotificationPreference : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    // =============================================
    // Channel Preferences
    // =============================================

    /// <summary>
    /// Receive email notifications
    /// </summary>
    public bool EmailEnabled { get; set; } = true;

    /// <summary>
    /// Receive push notifications
    /// </summary>
    public bool PushEnabled { get; set; } = true;

    /// <summary>
    /// Receive SMS notifications
    /// </summary>
    public bool SmsEnabled { get; set; } = false;

    /// <summary>
    /// Receive in-app notifications
    /// </summary>
    public bool InAppEnabled { get; set; } = true;

    // =============================================
    // Notification Type Preferences
    // =============================================

    /// <summary>
    /// Notifications for new messages
    /// </summary>
    public bool MessagesEnabled { get; set; } = true;

    /// <summary>
    /// Notifications for match requests
    /// </summary>
    public bool MatchRequestsEnabled { get; set; } = true;

    /// <summary>
    /// Notifications for appointment reminders
    /// </summary>
    public bool AppointmentRemindersEnabled { get; set; } = true;

    /// <summary>
    /// Notifications for new reviews
    /// </summary>
    public bool ReviewsEnabled { get; set; } = true;

    /// <summary>
    /// Notifications for system announcements
    /// </summary>
    public bool SystemAnnouncementsEnabled { get; set; } = true;

    /// <summary>
    /// Notifications for marketing/promotional content
    /// </summary>
    public bool MarketingEnabled { get; set; } = false;

    /// <summary>
    /// Weekly digest email
    /// </summary>
    public bool WeeklyDigestEnabled { get; set; } = true;

    // =============================================
    // Quiet Hours
    // =============================================

    /// <summary>
    /// Enable quiet hours (no notifications during certain times)
    /// </summary>
    public bool QuietHoursEnabled { get; set; } = false;

    /// <summary>
    /// Quiet hours start time (HH:mm)
    /// </summary>
    [MaxLength(10)]
    public string? QuietHoursStart { get; set; }

    /// <summary>
    /// Quiet hours end time (HH:mm)
    /// </summary>
    [MaxLength(10)]
    public string? QuietHoursEnd { get; set; }

    // Navigation
    public virtual User User { get; set; } = null!;

    // Factory method
    public static UserNotificationPreference CreateDefault(string userId)
    {
        return new UserNotificationPreference
        {
            UserId = userId
        };
    }
}
