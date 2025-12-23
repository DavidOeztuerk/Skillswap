using CQRS.Models;
using MediatR;

namespace NotificationService.Application.Commands;

public record RegisterPushTokenCommand(string UserId, string Token) : IRequest<ApiResponse<bool>>;
