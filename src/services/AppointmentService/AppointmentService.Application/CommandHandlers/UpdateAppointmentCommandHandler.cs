using AppointmentService.Application.Commands;
using AppointmentService.Domain.Repositories;
using Contracts.Appointment.Responses;
using CQRS.Handlers;
using CQRS.Models;
using Core.Common.Exceptions;
using Microsoft.Extensions.Logging;

namespace AppointmentService.Application.CommandHandlers;

public class UpdateAppointmentCommandHandler(
    IAppointmentUnitOfWork unitOfWork,
    ILogger<UpdateAppointmentCommandHandler> logger)
    : BaseCommandHandler<UpdateAppointmentCommand, UpdateAppointmentResponse>(logger)
{
    private readonly IAppointmentUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<UpdateAppointmentResponse>> Handle(
        UpdateAppointmentCommand request,
        CancellationToken cancellationToken)
    {
        Logger.LogInformation(
            "Updating appointment {AppointmentId} by user {UserId}",
            request.AppointmentId,
            request.UserId);

        // Get the appointment
        var appointment = await _unitOfWork.SessionAppointments.GetByIdAsync(
            request.AppointmentId,
            cancellationToken);

        if (appointment == null)
        {
            throw new ResourceNotFoundException("Appointment", request.AppointmentId);
        }

        // Authorization check - only organizer or participant can update
        if (appointment.OrganizerUserId != request.UserId &&
            appointment.ParticipantUserId != request.UserId)
        {
            return Error(
                "You are not authorized to update this appointment",
                ErrorCodes.InsufficientPermissions);
        }

        // Cannot update cancelled or completed appointments
        if (appointment.IsCancelled)
        {
            return Error(
                "Cannot update a cancelled appointment",
                ErrorCodes.InvalidOperation);
        }

        if (appointment.IsCompleted)
        {
            return Error(
                "Cannot update a completed appointment",
                ErrorCodes.InvalidOperation);
        }

        // Apply updates
        var hasChanges = false;

        if (!string.IsNullOrWhiteSpace(request.Title) && request.Title != appointment.Title)
        {
            appointment.Title = request.Title;
            hasChanges = true;
        }

        if (request.Description != null && request.Description != appointment.Description)
        {
            appointment.Description = request.Description;
            hasChanges = true;
        }

        if (!string.IsNullOrWhiteSpace(request.MeetingLink) && request.MeetingLink != appointment.MeetingLink)
        {
            appointment.UpdateMeetingLink(request.MeetingLink);
            hasChanges = true;
        }

        if (!hasChanges)
        {
            return Success(
                new UpdateAppointmentResponse(
                    appointment.Id,
                    appointment.Title,
                    appointment.Description,
                    appointment.MeetingLink,
                    new DateTimeOffset(appointment.UpdatedAt ?? appointment.CreatedAt, TimeSpan.Zero)),
                "No changes to apply");
        }

        // Save changes
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        Logger.LogInformation(
            "Successfully updated appointment {AppointmentId}",
            request.AppointmentId);

        var response = new UpdateAppointmentResponse(
            appointment.Id,
            appointment.Title,
            appointment.Description,
            appointment.MeetingLink,
            new DateTimeOffset(appointment.UpdatedAt ?? DateTime.UtcNow, TimeSpan.Zero));

        return Success(response, "Appointment updated successfully");
    }
}
