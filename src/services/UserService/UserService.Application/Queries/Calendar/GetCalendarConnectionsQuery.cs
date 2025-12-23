using CQRS.Models;
using MediatR;

namespace UserService.Application.Queries.Calendar;

/// <summary>
/// Response for a single calendar connection
/// </summary>
public record CalendarConnectionResponse
{
    public string Id { get; init; } = string.Empty;
    public string Provider { get; init; } = string.Empty;
    public string? ProviderEmail { get; init; }
    public string? CalendarId { get; init; }
    public bool SyncEnabled { get; init; }
    public DateTime? LastSyncAt { get; init; }
    public int SyncCount { get; init; }
    public string? LastSyncError { get; init; }
    public bool IsTokenExpired { get; init; }
    public DateTime CreatedAt { get; init; }
}

/// <summary>
/// Query to get all calendar connections for a user
/// </summary>
public record GetCalendarConnectionsQuery(string UserId) : IRequest<ApiResponse<List<CalendarConnectionResponse>>>;
