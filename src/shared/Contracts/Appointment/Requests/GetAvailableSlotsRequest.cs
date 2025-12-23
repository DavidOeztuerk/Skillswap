using System.ComponentModel.DataAnnotations;

namespace Contracts.Appointment.Requests;

/// <summary>
/// Request to find available time slots for scheduling
/// </summary>
public record GetAvailableSlotsRequest
{
    /// <summary>
    /// The other user to find mutual availability with
    /// </summary>
    [Required(ErrorMessage = "OtherUserId is required")]
    public string OtherUserId { get; init; } = string.Empty;

    /// <summary>
    /// Preferred days of week (0=Sunday, 6=Saturday). Empty means all days.
    /// </summary>
    public List<int>? PreferredDaysOfWeek { get; init; }

    /// <summary>
    /// Preferred time slots (e.g., "09:00-12:00", "14:00-18:00"). Empty means all times.
    /// </summary>
    public List<string>? PreferredTimeSlots { get; init; }

    /// <summary>
    /// Duration of the session in minutes. Default: 60
    /// </summary>
    [Range(15, 480, ErrorMessage = "Session duration must be between 15 and 480 minutes")]
    public int SessionDurationMinutes { get; init; } = 60;

    /// <summary>
    /// Number of slots to return. Default: 10
    /// </summary>
    [Range(1, 50, ErrorMessage = "Number of slots must be between 1 and 50")]
    public int NumberOfSlots { get; init; } = 10;
}
