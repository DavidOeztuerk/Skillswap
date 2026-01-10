using AppointmentService.Application.Commands;
using AppointmentService.Domain.Entities;
using AppointmentService.Domain.Enums;
using AppointmentService.Domain.Repositories;
using CQRS.Handlers;
using CQRS.Models;
using Contracts.Appointment.Responses;
using Events.Domain.Appointment;
using EventSourcing;
using Core.Common.Exceptions;
using Microsoft.Extensions.Logging;

namespace AppointmentService.Application.CommandHandlers;

public class RescheduleSessionCommandHandler(
    IAppointmentUnitOfWork unitOfWork,
    IDomainEventPublisher eventPublisher,
    ILogger<RescheduleSessionCommandHandler> logger)
    : BaseCommandHandler<RescheduleSessionCommand, SessionStatusResponse>(logger)
{
    private readonly IAppointmentUnitOfWork _unitOfWork = unitOfWork;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<SessionStatusResponse>> Handle(
        RescheduleSessionCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation("Requesting reschedule for session: {SessionAppointmentId}", request.SessionAppointmentId);

            var appointment = await _unitOfWork.SessionAppointments.GetByIdAsync(request.SessionAppointmentId, cancellationToken);

            if (appointment == null)
                return Error("Session appointment not found", ErrorCodes.ResourceNotFound);

            // Verify user is participant or organizer
            if (appointment.OrganizerUserId != request.RequestedByUserId &&
                appointment.ParticipantUserId != request.RequestedByUserId)
                return Error("User is not part of this session", ErrorCodes.Unauthorized);

            // Check if session can be rescheduled
            if (appointment.Status != SessionAppointmentStatus.Confirmed &&
                appointment.Status != SessionAppointmentStatus.PaymentCompleted)
                return Error($"Cannot reschedule session with status {appointment.Status}", ErrorCodes.InvalidOperation);

            // Request reschedule
            appointment.Status = SessionAppointmentStatus.RescheduleRequested;
            appointment.RescheduleRequestedByUserId = request.RequestedByUserId;
            appointment.ProposedRescheduleDate = request.ProposedDate;
            appointment.ProposedRescheduleDuration = request.ProposedDurationMinutes;
            appointment.RescheduleReason = request.Reason;
            appointment.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Publish domain event
            await _eventPublisher.Publish(
                new SessionRescheduleRequestedEvent(
                    appointment.Id,
                    request.RequestedByUserId,
                    request.ProposedDate,
                    request.ProposedDurationMinutes,
                    request.Reason ?? string.Empty),
                cancellationToken);

            Logger.LogInformation("Reschedule requested successfully: {SessionAppointmentId}", request.SessionAppointmentId);

            return Success(new SessionStatusResponse(
                appointment.Id,
                appointment.Status.ToString(),
                appointment.UpdatedAt,
                appointment.MeetingLink),
                "Reschedule request sent to other party");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error requesting reschedule: {SessionAppointmentId}", request.SessionAppointmentId);
            return Error("Failed to request reschedule", ErrorCodes.InternalError);
        }
    }
}
