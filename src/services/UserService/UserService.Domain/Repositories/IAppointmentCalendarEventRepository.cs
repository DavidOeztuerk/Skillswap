using UserService.Domain.Models;

namespace UserService.Domain.Repositories;

/// <summary>
/// Repository for managing appointment calendar event mappings
/// </summary>
public interface IAppointmentCalendarEventRepository
{
    /// <summary>
    /// Get all calendar events for an appointment
    /// </summary>
    Task<List<AppointmentCalendarEvent>> GetByAppointmentIdAsync(
        string appointmentId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get calendar event for a specific appointment and user
    /// </summary>
    Task<AppointmentCalendarEvent?> GetByAppointmentAndUserAsync(
        string appointmentId,
        string userId,
        string provider,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all calendar events for a user
    /// </summary>
    Task<List<AppointmentCalendarEvent>> GetByUserIdAsync(
        string userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get calendar event by external event ID
    /// </summary>
    Task<AppointmentCalendarEvent?> GetByExternalEventIdAsync(
        string externalEventId,
        string provider,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Add a new calendar event mapping
    /// </summary>
    Task<AppointmentCalendarEvent> AddAsync(
        AppointmentCalendarEvent calendarEvent,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Update an existing calendar event mapping
    /// </summary>
    Task UpdateAsync(
        AppointmentCalendarEvent calendarEvent,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete a calendar event mapping
    /// </summary>
    Task DeleteAsync(
        AppointmentCalendarEvent calendarEvent,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete all calendar events for an appointment
    /// </summary>
    Task DeleteByAppointmentIdAsync(
        string appointmentId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Save changes to the database
    /// </summary>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
