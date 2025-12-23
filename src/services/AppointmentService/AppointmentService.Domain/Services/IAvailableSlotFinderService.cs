using AppointmentService.Domain.Entities;

namespace AppointmentService.Domain.Services;

/// <summary>
/// Service to find available time slots for scheduling sessions
/// Prepared for future integration with email provider calendars (Google/Outlook)
/// </summary>
public interface IAvailableSlotFinderService
{
    /// <summary>
    /// Finds the next available time slots for scheduling sessions between two users
    /// </summary>
    /// <param name="userId1">First user ID</param>
    /// <param name="userId2">Second user ID</param>
    /// <param name="preferredDaysOfWeek">Preferred days of week (0=Sunday, 6=Saturday)</param>
    /// <param name="preferredTimeSlots">Preferred time slots (e.g., "09:00-12:00", "14:00-18:00")</param>
    /// <param name="sessionDurationMinutes">Duration of each session in minutes</param>
    /// <param name="numberOfSlots">Number of available slots to find</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of available time slots</returns>
    Task<List<DateTime>> FindAvailableSlotsAsync(
        string userId1,
        string userId2,
        List<int> preferredDaysOfWeek,
        List<string> preferredTimeSlots,
        int sessionDurationMinutes,
        int numberOfSlots,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if a specific time slot is available for both users
    /// </summary>
    /// <param name="userId1">First user ID</param>
    /// <param name="userId2">Second user ID</param>
    /// <param name="proposedDateTime">Proposed date and time</param>
    /// <param name="durationMinutes">Duration in minutes</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if slot is available for both users</returns>
    Task<bool> IsSlotAvailableAsync(
        string userId1,
        string userId2,
        DateTime proposedDateTime,
        int durationMinutes,
        CancellationToken cancellationToken = default);
}
