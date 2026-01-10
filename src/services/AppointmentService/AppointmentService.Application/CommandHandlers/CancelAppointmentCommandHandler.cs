using AppointmentService.Application.Commands;
using AppointmentService.Domain.Entities;
using AppointmentService.Domain.Enums;
using AppointmentService.Domain.Repositories;
using Contracts.Appointment.Responses;
using CQRS.Handlers;
using CQRS.Models;
using Core.Common.Exceptions;
using Microsoft.Extensions.Logging;
using Events.Domain.Appointment;
using EventSourcing;

namespace AppointmentService.Application.CommandHandlers;

public class CancelAppointmentCommandHandler(
    IAppointmentUnitOfWork unitOfWork,
    IDomainEventPublisher eventPublisher,
    ILogger<CancelAppointmentCommandHandler> logger)
    : BaseCommandHandler<CancelAppointmentCommand, CancelAppointmentResponse>(logger)
{
    private readonly IAppointmentUnitOfWork _unitOfWork = unitOfWork;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<CancelAppointmentResponse>> Handle(
        CancelAppointmentCommand request,
        CancellationToken cancellationToken)
    {
        {
            var appointment = await _unitOfWork.SessionAppointments.GetByIdAsync(request.AppointmentId, cancellationToken);

            if (appointment == null || appointment.IsDeleted)
            {
                throw new ResourceNotFoundException("SessionAppointment", request.AppointmentId);
            }

            if (appointment.OrganizerUserId != request.UserId && appointment.ParticipantUserId != request.UserId)
            {
                return Error("You are not authorized to cancel this appointment", ErrorCodes.InsufficientPermissions);
            }

            if (appointment.Status == SessionAppointmentStatus.Cancelled)
            {
                return Error("Appointment is already cancelled", ErrorCodes.InvalidOperation);
            }

            var now = DateTime.UtcNow;

            // Cancel method signature: Cancel(string cancelledByUserId, string? reason = null)
            appointment.Cancel(request.UserId!, request.Reason);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

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
    }
}
