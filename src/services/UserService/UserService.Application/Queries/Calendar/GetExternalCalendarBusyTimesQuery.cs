using CQRS.Models;
using MediatR;

namespace UserService.Application.Queries.Calendar;

/// <summary>
/// Query to get busy times from a user's connected external calendars
/// </summary>
public record GetExternalCalendarBusyTimesQuery(
    string UserId,
    DateTime StartTime,
    DateTime EndTime
) : IRequest<ApiResponse<ExternalBusyTimesResponse>>;

/// <summary>
/// Response containing busy time slots from external calendars
/// </summary>
public record ExternalBusyTimesResponse
{
    /// <summary>
    /// Whether the user has any connected calendars
    /// </summary>
    public bool HasConnectedCalendars { get; init; }

    /// <summary>
    /// List of connected calendar providers (Google, Microsoft, Apple)
    /// </summary>
    public List<string> ConnectedProviders { get; init; } = [];

    /// <summary>
    /// Aggregated busy time slots from all connected calendars
    /// </summary>
    public List<BusyTimeSlot> BusySlots { get; init; } = [];

    /// <summary>
    /// Any errors that occurred while fetching busy times
    /// </summary>
    public List<CalendarError> Errors { get; init; } = [];
}

/// <summary>
/// Represents a busy time slot
/// </summary>
public record BusyTimeSlot
{
    /// <summary>
    /// Start time of the busy slot (UTC)
    /// </summary>
    public DateTime Start { get; init; }

    /// <summary>
    /// End time of the busy slot (UTC)
    /// </summary>
    public DateTime End { get; init; }

    /// <summary>
    /// Optional title (may be hidden for privacy)
    /// </summary>
    public string? Title { get; init; }

    /// <summary>
    /// Which calendar provider this slot came from
    /// </summary>
    public string Provider { get; init; } = string.Empty;
}

/// <summary>
/// Error from a specific calendar provider
/// </summary>
public record CalendarError
{
    /// <summary>
    /// Provider that had the error
    /// </summary>
    public string Provider { get; init; } = string.Empty;

    /// <summary>
    /// Error message
    /// </summary>
    public string Message { get; init; } = string.Empty;
}
