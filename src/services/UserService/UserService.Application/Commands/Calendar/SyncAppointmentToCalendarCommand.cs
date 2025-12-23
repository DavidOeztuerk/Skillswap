using CQRS.Models;
using MediatR;

namespace UserService.Application.Commands.Calendar;

/// <summary>
/// Command to sync an appointment to a user's external calendars
/// </summary>
public record SyncAppointmentToCalendarCommand(
    string AppointmentId,
    string UserId,
    string Title,
    string Description,
    DateTime StartTime,
    DateTime EndTime,
    string? Location,
    string? MeetingLink,
    List<string> AttendeeEmails
) : IRequest<ApiResponse<CalendarSyncResult>>;

/// <summary>
/// Command to update an existing appointment in external calendars
/// </summary>
public record UpdateCalendarAppointmentCommand(
    string AppointmentId,
    string UserId,
    string Title,
    string Description,
    DateTime StartTime,
    DateTime EndTime,
    string? Location,
    string? MeetingLink,
    List<string> AttendeeEmails
) : IRequest<ApiResponse<CalendarSyncResult>>;

/// <summary>
/// Command to delete an appointment from external calendars
/// </summary>
public record DeleteCalendarAppointmentCommand(
    string AppointmentId,
    string UserId
) : IRequest<ApiResponse<CalendarSyncResult>>;

/// <summary>
/// Result of a calendar sync operation
/// </summary>
public record CalendarSyncResult
{
    /// <summary>
    /// Whether any calendars were synced successfully
    /// </summary>
    public bool Success { get; init; }

    /// <summary>
    /// Number of calendars successfully synced
    /// </summary>
    public int SyncedCount { get; init; }

    /// <summary>
    /// Number of calendars that failed to sync
    /// </summary>
    public int FailedCount { get; init; }

    /// <summary>
    /// Details of each sync operation
    /// </summary>
    public List<CalendarSyncDetail> Details { get; init; } = [];
}

/// <summary>
/// Details of sync to a specific calendar provider
/// </summary>
public record CalendarSyncDetail
{
    public string Provider { get; init; } = string.Empty;
    public bool Success { get; init; }
    public string? ExternalEventId { get; init; }
    public string? Error { get; init; }
}
