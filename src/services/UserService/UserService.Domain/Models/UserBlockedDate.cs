using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace UserService.Domain.Models;

/// <summary>
/// User blocked dates (replaces User.BlockedDatesJson)
/// Represents dates when user is not available (vacation, holidays, etc.)
/// </summary>
public class UserBlockedDate : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// The blocked date
    /// </summary>
    [Required]
    public DateTime BlockedDate { get; set; }

    /// <summary>
    /// Optional end date for date ranges
    /// </summary>
    public DateTime? EndDate { get; set; }

    /// <summary>
    /// Whether this blocks the entire day or just specific times
    /// </summary>
    public bool IsAllDay { get; set; } = true;

    /// <summary>
    /// Optional: Start time if not all day (HH:mm)
    /// </summary>
    [MaxLength(10)]
    public string? StartTime { get; set; }

    /// <summary>
    /// Optional: End time if not all day (HH:mm)
    /// </summary>
    [MaxLength(10)]
    public string? EndTime { get; set; }

    /// <summary>
    /// Reason for blocking (e.g., "Vacation", "Holiday", "Personal")
    /// </summary>
    [MaxLength(200)]
    public string? Reason { get; set; }

    /// <summary>
    /// Whether this is a recurring block (e.g., yearly holiday)
    /// </summary>
    public bool IsRecurring { get; set; } = false;

    /// <summary>
    /// Recurrence pattern if recurring (e.g., "yearly", "monthly")
    /// </summary>
    [MaxLength(50)]
    public string? RecurrencePattern { get; set; }

    // Navigation
    public virtual User User { get; set; } = null!;

    // Factory methods
    public static UserBlockedDate CreateSingleDay(string userId, DateTime date, string? reason = null)
    {
        return new UserBlockedDate
        {
            UserId = userId,
            BlockedDate = date.Date,
            IsAllDay = true,
            Reason = reason
        };
    }

    public static UserBlockedDate CreateDateRange(string userId, DateTime startDate, DateTime endDate, string? reason = null)
    {
        return new UserBlockedDate
        {
            UserId = userId,
            BlockedDate = startDate.Date,
            EndDate = endDate.Date,
            IsAllDay = true,
            Reason = reason
        };
    }

    public static UserBlockedDate CreateTimeBlock(string userId, DateTime date, string startTime, string endTime, string? reason = null)
    {
        return new UserBlockedDate
        {
            UserId = userId,
            BlockedDate = date.Date,
            IsAllDay = false,
            StartTime = startTime,
            EndTime = endTime,
            Reason = reason
        };
    }
}
