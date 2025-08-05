using AppointmentService.Application.Commands;
using AppointmentService.Domain.Entities;
using Contracts.Appointment.Responses;
using CQRS.Handlers;
using CQRS.Models;
using Events.Domain.Appointment;
using EventSourcing;
using Microsoft.EntityFrameworkCore;

namespace AppointmentService.Application.CommandHandlers;

public class CancelAppointmentCommandHandler(
    AppointmentDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    ILogger<CancelAppointmentCommandHandler> logger)
    : BaseCommandHandler<CancelAppointmentCommand, CancelAppointmentResponse>(logger)
{
    private readonly AppointmentDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<CancelAppointmentResponse>> Handle(
        CancelAppointmentCommand request,
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
                return Error("You are not authorized to cancel this appointment");
            }

            if (appointment.Status == AppointmentStatus.Cancelled)
            {
                return Error("Appointment is already cancelled");
            }

            var now = DateTime.UtcNow;

            appointment.Cancel(request.Reason);
            await _dbContext.SaveChangesAsync(cancellationToken);

            // Publish domain event
            await _eventPublisher.Publish(new AppointmentCancelledDomainEvent(
                appointment.Id,
                request.UserId,
                request.Reason,
                appointment.CancelledAt ?? now),
                cancellationToken);

            var response = new CancelAppointmentResponse(
                appointment.Id,
                true,
                appointment.CancelledAt ?? now);

            return Success(response, "Appointment cancelled successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error cancelling appointment {AppointmentId}", request.AppointmentId);
            return Error("An error occurred while cancelling the appointment");
        }
    }
}
