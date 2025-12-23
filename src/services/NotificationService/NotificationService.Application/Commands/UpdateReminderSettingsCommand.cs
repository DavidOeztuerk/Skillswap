using CQRS.Models;
using MediatR;
using NotificationService.Domain.ResponseModels;

namespace NotificationService.Application.Commands;

public record UpdateReminderSettingsCommand(
    string UserId,
    int[] ReminderMinutesBefore,
    bool EmailRemindersEnabled,
    bool PushRemindersEnabled,
    bool SmsRemindersEnabled
) : IRequest<ApiResponse<ReminderSettingsResponse>>;
