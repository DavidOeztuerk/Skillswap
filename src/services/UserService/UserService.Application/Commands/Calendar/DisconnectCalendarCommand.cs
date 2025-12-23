using CQRS.Models;
using MediatR;

namespace UserService.Application.Commands.Calendar;

/// <summary>
/// Command to disconnect a calendar provider
/// </summary>
public record DisconnectCalendarCommand(
    string UserId,
    string Provider) : IRequest<ApiResponse<bool>>;
