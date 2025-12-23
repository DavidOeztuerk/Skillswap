using CQRS.Models;
using MediatR;
using NotificationService.Domain.ResponseModels;

namespace NotificationService.Application.Queries;

public record GetReminderSettingsQuery(string UserId) : IRequest<ApiResponse<ReminderSettingsResponse>>;
