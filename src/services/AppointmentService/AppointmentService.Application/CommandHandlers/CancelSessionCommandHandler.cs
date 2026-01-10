using AppointmentService.Application.Commands;
using AppointmentService.Domain.Entities;
using AppointmentService.Domain.Enums;
using AppointmentService.Domain.Repositories;
using CQRS.Handlers;
using CQRS.Models;
using Contracts.Appointment.Responses;
using Events.Domain.Appointment;
using Microsoft.Extensions.Logging;
using EventSourcing;
using Core.Common.Exceptions;

namespace AppointmentService.Application.CommandHandlers;

public class CancelSessionCommandHandler(
    IAppointmentUnitOfWork unitOfWork,
    IDomainEventPublisher eventPublisher,
    ILogger<CancelSessionCommandHandler> logger)
    : BaseCommandHandler<CancelSessionCommand, SessionStatusResponse>(logger)
{
    private readonly IAppointmentUnitOfWork _unitOfWork = unitOfWork;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<SessionStatusResponse>> Handle(
        CancelSessionCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation("Cancelling session: {SessionAppointmentId}", request.SessionAppointmentId);

            var appointment = await _unitOfWork.SessionAppointments.GetWithSeriesAsync(request.SessionAppointmentId, cancellationToken);

            if (appointment == null)
                return Error("Session appointment not found", ErrorCodes.ResourceNotFound);

            // Verify user has permission to cancel
            if (appointment.OrganizerUserId != request.CancelledByUserId &&
                appointment.ParticipantUserId != request.CancelledByUserId)
                return Error("User is not part of this session", ErrorCodes.Unauthorized);

            // Check cancellation window (within 24 hours = late cancellation)
            var hoursUntilSession = (appointment.ScheduledDate - DateTime.UtcNow).TotalHours;
            var isLateCancellation = hoursUntilSession <= 24 && hoursUntilSession > 0;

            // Cancel session
            appointment.Status = SessionAppointmentStatus.Cancelled;
            appointment.CancelledByUserId = request.CancelledByUserId;
            appointment.CancelledAt = DateTime.UtcNow;
            appointment.CancellationReason = request.Reason;
            appointment.IsLateCancellation = isLateCancellation;
            appointment.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Publish domain event
            await _eventPublisher.Publish(
                new SessionCancelledEvent(
                    appointment.Id,
                    appointment.SessionSeriesId,
                    request.CancelledByUserId,
                    request.Reason,
                    isLateCancellation),
                cancellationToken);

            Logger.LogInformation("Session cancelled successfully: {SessionAppointmentId}", request.SessionAppointmentId);

            return Success(new SessionStatusResponse(
                appointment.Id,
                appointment.Status.ToString(),
                appointment.CancelledAt,
                null),
                isLateCancellation ? "Session cancelled with late cancellation penalty" : "Session cancelled successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error cancelling session: {SessionAppointmentId}", request.SessionAppointmentId);
            return Error("Failed to cancel session", ErrorCodes.InternalError);
        }
    }
}
