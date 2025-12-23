using CQRS.Models;
using MediatR;
using UserService.Application.Queries.Calendar;

namespace UserService.Application.Commands.Calendar;

/// <summary>
/// Command to complete calendar connection - exchanges OAuth code for tokens
/// </summary>
public record CompleteCalendarConnectCommand(
    string Code,
    string State,
    string RedirectUri) : IRequest<ApiResponse<CalendarConnectionResponse>>;
