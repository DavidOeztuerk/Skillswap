using AppointmentService.Application.Commands;
using AppointmentService.Domain.Repositories;
using AppointmentService.Domain.Services;
using CQRS.Handlers;
using CQRS.Models;
using Core.Common.Exceptions;
using Microsoft.Extensions.Logging;

namespace AppointmentService.Application.CommandHandlers;

public class SendReminderCommandHandler(
    IAppointmentUnitOfWork unitOfWork,
    INotificationServiceClient notificationClient,
    ILogger<SendReminderCommandHandler> logger)
    : BaseCommandHandler<SendReminderCommand, bool>(logger)
{
    private readonly IAppointmentUnitOfWork _unitOfWork = unitOfWork;
    private readonly INotificationServiceClient _notificationClient = notificationClient;

    public override async Task<ApiResponse<bool>> Handle(
        SendReminderCommand request,
        CancellationToken cancellationToken)
    {
        var appt = await _unitOfWork.SessionAppointments.GetByIdAsync(request.AppointmentId, cancellationToken);
        if (appt == null)
        {
            return Error("Appointment not found", ErrorCodes.ResourceNotFound);
        }

        // Send to both participants
        var title = appt.Title;
        var scheduledDate = appt.ScheduledDate;

        var results = await Task.WhenAll(
            _notificationClient.SendAppointmentReminderNotificationAsync(appt.OrganizerUserId, appt.Id, title, scheduledDate, request.MinutesBefore, cancellationToken),
            _notificationClient.SendAppointmentReminderNotificationAsync(appt.ParticipantUserId, appt.Id, title, scheduledDate, request.MinutesBefore, cancellationToken)
        );

        var success = results.All(r => r);
        return Success(success, success ? "Reminders sent" : "Failed to send some reminders");
    }
}
