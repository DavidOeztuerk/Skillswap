using AppointmentService.Application.Commands;
using AppointmentService.Domain.Entities;
using AppointmentService.Domain.Repositories;
using CQRS.Handlers;
using CQRS.Models;
using Core.Common.Exceptions;
using Microsoft.Extensions.Logging;

namespace AppointmentService.Application.CommandHandlers;

public class CompleteAppointmentCommandHandler(
    IAppointmentUnitOfWork unitOfWork,
    ILogger<CompleteAppointmentCommandHandler> logger)
    : BaseCommandHandler<CompleteAppointmentCommand, CompleteAppointmentResponse>(logger)
{
    private readonly IAppointmentUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<CompleteAppointmentResponse>> Handle(
        CompleteAppointmentCommand request,
        CancellationToken cancellationToken)
    {
        var appt = await _unitOfWork.SessionAppointments.GetByIdAsync(request.AppointmentId, cancellationToken);
        if (appt == null)
        {
            return Error("Appointment not found", ErrorCodes.ResourceNotFound);
        }

        // SECURITY FIX: Corrected authorization logic
        // Only organizer or participant can complete the appointment
        // Previous bug: !string.IsNullOrEmpty(request.UserId) allowed null/empty UserId to bypass check
        if (string.IsNullOrEmpty(request.UserId) ||
            (request.UserId != appt.OrganizerUserId && request.UserId != appt.ParticipantUserId))
        {
            Logger.LogWarning(
                "Unauthorized attempt to complete appointment {AppointmentId} by user {UserId}. " +
                "Organizer: {OrganizerId}, Participant: {ParticipantId}",
                request.AppointmentId,
                request.UserId ?? "NULL",
                appt.OrganizerUserId,
                appt.ParticipantUserId);

            return Error("Not authorized to complete this appointment", ErrorCodes.InsufficientPermissions);
        }

        Logger.LogInformation(
            "User {UserId} completing appointment {AppointmentId}",
            request.UserId,
            request.AppointmentId);

        // Optional: validate it is time to complete
        appt.Complete();

        // If a session duration was provided, adjust duration only if not set
        if (request.SessionDurationMinutes.HasValue && request.SessionDurationMinutes.Value > 0)
        {
            appt.DurationMinutes = request.SessionDurationMinutes.Value;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var resp = new CompleteAppointmentResponse(
            appt.Id,
            appt.Status,
            appt.CompletedAt ?? DateTime.UtcNow);

        Logger.LogInformation(
            "Appointment {AppointmentId} completed successfully by user {UserId}",
            request.AppointmentId,
            request.UserId);

        return Success(resp, "Appointment completed");
    }
}
