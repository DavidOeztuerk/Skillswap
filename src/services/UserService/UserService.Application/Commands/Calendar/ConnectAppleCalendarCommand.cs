using CQRS.Models;
using MediatR;
using UserService.Application.Queries.Calendar;

namespace UserService.Application.Commands.Calendar;

/// <summary>
/// Command to connect Apple Calendar using app-specific password (CalDAV)
/// </summary>
public record ConnectAppleCalendarCommand(
    string UserId,
    string Credentials) : IRequest<ApiResponse<CalendarConnectionResponse>>;
