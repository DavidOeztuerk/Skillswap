using CQRS.Models;
using MediatR;
using Microsoft.Extensions.Logging;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Repositories;

namespace NotificationService.Application.CommandHandlers;

public class ScheduleAppointmentRemindersCommandHandler : IRequestHandler<ScheduleAppointmentRemindersCommand, ApiResponse<int>>
{
    private readonly INotificationUnitOfWork _unitOfWork;
    private readonly ILogger<ScheduleAppointmentRemindersCommandHandler> _logger;

    public ScheduleAppointmentRemindersCommandHandler(
        INotificationUnitOfWork unitOfWork,
        ILogger<ScheduleAppointmentRemindersCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<ApiResponse<int>> Handle(ScheduleAppointmentRemindersCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Cancel any existing reminders for this appointment
            await _unitOfWork.ScheduledReminders.CancelByAppointmentIdAsync(request.AppointmentId, cancellationToken);

            // Get user's reminder settings
            var settings = await _unitOfWork.ReminderSettings.GetByUserIdAsync(request.UserId, cancellationToken);
            var reminderMinutes = settings?.GetReminderMinutes() ?? new[] { 15, 60 }; // Default: 15min, 1h

            var remindersToCreate = new List<ScheduledReminder>();

            foreach (var minutes in reminderMinutes)
            {
                var scheduledFor = request.AppointmentTime.AddMinutes(-minutes);

                // Don't schedule reminders in the past
                if (scheduledFor <= DateTime.UtcNow)
                {
                    _logger.LogDebug("Skipping reminder {Minutes}min before for appointment {AppointmentId} - already past",
                        minutes, request.AppointmentId);
                    continue;
                }

                // Create Email reminder if enabled
                if (settings?.EmailRemindersEnabled ?? true)
                {
                    remindersToCreate.Add(CreateReminder(request, "Email", scheduledFor, minutes));
                }

                // Create Push reminder if enabled
                if (settings?.PushRemindersEnabled ?? true)
                {
                    remindersToCreate.Add(CreateReminder(request, "Push", scheduledFor, minutes));
                }

                // Create SMS reminder if enabled
                if (settings?.SmsRemindersEnabled ?? false)
                {
                    remindersToCreate.Add(CreateReminder(request, "SMS", scheduledFor, minutes));
                }
            }

            if (remindersToCreate.Count > 0)
            {
                await _unitOfWork.ScheduledReminders.CreateManyAsync(remindersToCreate, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }

            _logger.LogInformation("Scheduled {Count} reminders for appointment {AppointmentId}, user {UserId}",
                remindersToCreate.Count, request.AppointmentId, request.UserId);

            return ApiResponse<int>.SuccessResult(remindersToCreate.Count, $"{remindersToCreate.Count} reminders scheduled");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error scheduling reminders for appointment {AppointmentId}", request.AppointmentId);
            return ApiResponse<int>.ErrorResult("Failed to schedule reminders");
        }
    }

    private static ScheduledReminder CreateReminder(ScheduleAppointmentRemindersCommand request, string reminderType, DateTime scheduledFor, int minutes)
    {
        return new ScheduledReminder
        {
            AppointmentId = request.AppointmentId,
            UserId = request.UserId,
            ReminderType = reminderType,
            ScheduledFor = scheduledFor,
            MinutesBefore = minutes,
            Status = "Pending",
            PartnerName = request.PartnerName,
            SkillName = request.SkillName,
            MeetingLink = request.MeetingLink,
            AppointmentTime = request.AppointmentTime
        };
    }
}
