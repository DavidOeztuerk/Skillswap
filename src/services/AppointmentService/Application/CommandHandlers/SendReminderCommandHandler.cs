using AppointmentService.Application.Commands;
using AppointmentService.Infrastructure.HttpClients;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.EntityFrameworkCore;
using Core.Common.Exceptions;

namespace AppointmentService.Application.CommandHandlers;

public class SendReminderCommandHandler(
    AppointmentDbContext dbContext,
    INotificationServiceClient notificationClient,
    ILogger<SendReminderCommandHandler> logger)
    : BaseCommandHandler<SendReminderCommand, bool>(logger)
{
    private readonly AppointmentDbContext _dbContext = dbContext;
    private readonly INotificationServiceClient _notificationClient = notificationClient;

    public override async Task<ApiResponse<bool>> Handle(
        SendReminderCommand request,
        CancellationToken cancellationToken)
    {
        var appt = await _dbContext.Appointments.AsNoTracking().FirstOrDefaultAsync(a => a.Id == request.AppointmentId, cancellationToken);
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
