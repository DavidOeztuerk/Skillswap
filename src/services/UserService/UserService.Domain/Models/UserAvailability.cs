using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace UserService.Domain.Models;

/// <summary>
/// User availability slots (replaces User.AvailabilityJson)
/// Represents when a user is available for sessions
/// </summary>
public class UserAvailability : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Day of week: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string DayOfWeek { get; set; } = string.Empty;

    /// <summary>
    /// Start time in HH:mm format (e.g., "09:00")
    /// </summary>
    [Required]
    [MaxLength(10)]
    public string StartTime { get; set; } = string.Empty;

    /// <summary>
    /// End time in HH:mm format (e.g., "17:00")
    /// </summary>
    [Required]
    [MaxLength(10)]
    public string EndTime { get; set; } = string.Empty;

    /// <summary>
    /// Whether this slot is currently active
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Optional: Timezone for this availability (defaults to user's timezone)
    /// </summary>
    [MaxLength(100)]
    public string? TimeZone { get; set; }

    // Navigation
    public virtual User User { get; set; } = null!;

    // Factory method
    public static UserAvailability Create(string userId, string dayOfWeek, string startTime, string endTime, string? timeZone = null)
    {
        return new UserAvailability
        {
            UserId = userId,
            DayOfWeek = dayOfWeek,
            StartTime = startTime,
            EndTime = endTime,
            TimeZone = timeZone,
            IsActive = true
        };
    }
}
