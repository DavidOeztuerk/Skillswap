using AppointmentService.Application.Commands;
using AppointmentService.Domain.Entities;
using Contracts.Appointment.Responses;
using CQRS.Handlers;
using CQRS.Models;
using Events.Domain.Appointment;
using EventSourcing;
using Microsoft.EntityFrameworkCore;

namespace AppointmentService.Application.CommandHandlers;

public class RescheduleAppointmentCommandHandler(
    AppointmentDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    ILogger<RescheduleAppointmentCommandHandler> logger)
    : BaseCommandHandler<RescheduleAppointmentCommand, RescheduleAppointmentResponse>(logger)
{
    private readonly AppointmentDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<RescheduleAppointmentResponse>> Handle(
        RescheduleAppointmentCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var appointment = await _dbContext.Appointments
                .FirstOrDefaultAsync(a => a.Id == request.AppointmentId && !a.IsDeleted, cancellationToken);

            if (appointment == null)
            {
                return Error("Appointment not found");
            }

            if (appointment.OrganizerUserId != request.UserId && appointment.ParticipantUserId != request.UserId)
            {
                return Error("You are not authorized to reschedule this appointment");
            }

            if (appointment.Status == AppointmentStatus.Cancelled || appointment.Status == AppointmentStatus.Completed)
            {
                return Error($"Cannot reschedule a {appointment.Status.ToLower()} appointment");
            }

            var oldScheduledDate = appointment.ScheduledDate;
            appointment.Reschedule(request.NewScheduledDate, request.Reason);
            await _dbContext.SaveChangesAsync(cancellationToken);

            // Publish domain event
            await _eventPublisher.Publish(new AppointmentRescheduledDomainEvent(
                appointment.Id,
                oldScheduledDate,
                request.NewScheduledDate,
                request.UserId),
                cancellationToken);

            var response = new RescheduleAppointmentResponse(
                appointment.Id,
                appointment.ScheduledDate,
                appointment.UpdatedAt!.Value);

            return Success(response, "Appointment rescheduled successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error rescheduling appointment {AppointmentId}", request.AppointmentId);
            return Error("An error occurred while rescheduling the appointment");
        }
    }
}
