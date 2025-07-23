using AppointmentService.Application.Commands;
using AppointmentService.Domain.Entities;
using Contracts.Appointment.Responses;
using CQRS.Handlers;
using Events.Domain.Appointment;
using EventSourcing;
using Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace AppointmentService.Application.CommandHandlers;

public class AcceptAppointmentCommandHandler(
    AppointmentDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    ILogger<AcceptAppointmentCommandHandler> logger)
    : BaseCommandHandler<AcceptAppointmentCommand, AcceptAppointmentResponse>(logger)
{
    private readonly AppointmentDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<AcceptAppointmentResponse>> Handle(
        AcceptAppointmentCommand request,
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

            if (appointment.ParticipantUserId != request.UserId)
            {
                return Error("You are not authorized to accept this appointment");
            }

            if (appointment.Status != AppointmentStatus.Pending)
            {
                return Error($"Cannot accept appointment in {appointment.Status} status");
            }

            appointment.Accept();
            await _dbContext.SaveChangesAsync(cancellationToken);

            // Publish domain event
            await _eventPublisher.Publish(new AppointmentAcceptedDomainEvent(
                appointment.Id,
                appointment.OrganizerUserId,
                appointment.ParticipantUserId,
                appointment.ScheduledDate), cancellationToken);

            var response = new AcceptAppointmentResponse(
                appointment.Id,
                appointment.Status,
                appointment.AcceptedAt!.Value);

            return Success(response, "Appointment accepted successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error accepting appointment {AppointmentId}", request.AppointmentId);
            return Error("An error occurred while accepting the appointment");
        }
    }
}