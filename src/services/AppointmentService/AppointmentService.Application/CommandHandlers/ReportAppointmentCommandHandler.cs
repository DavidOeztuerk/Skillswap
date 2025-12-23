using AppointmentService.Application.Commands;
using AppointmentService.Domain.Repositories;
using Contracts.Appointment.Responses;
using CQRS.Handlers;
using CQRS.Models;
using Core.Common.Exceptions;
using MassTransit;
using Microsoft.Extensions.Logging;
using Events.Integration.Moderation;

namespace AppointmentService.Application.CommandHandlers;

public class ReportAppointmentCommandHandler(
    IAppointmentUnitOfWork unitOfWork,
    IPublishEndpoint publishEndpoint,
    ILogger<ReportAppointmentCommandHandler> logger)
    : BaseCommandHandler<ReportAppointmentCommand, ReportAppointmentResponse>(logger)
{
    private readonly IAppointmentUnitOfWork _unitOfWork = unitOfWork;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;

    public override async Task<ApiResponse<ReportAppointmentResponse>> Handle(
        ReportAppointmentCommand request,
        CancellationToken cancellationToken)
    {
        Logger.LogInformation(
            "User {UserId} reporting appointment {AppointmentId} for reason: {Reason}",
            request.UserId,
            request.AppointmentId,
            request.Reason);

        // Get the appointment
        var appointment = await _unitOfWork.SessionAppointments.GetByIdAsync(
            request.AppointmentId,
            cancellationToken);

        if (appointment == null)
        {
            throw new ResourceNotFoundException("Appointment", request.AppointmentId);
        }

        // User must be a participant
        if (appointment.OrganizerUserId != request.UserId &&
            appointment.ParticipantUserId != request.UserId)
        {
            return Error(
                "You can only report appointments you are participating in",
                ErrorCodes.InsufficientPermissions);
        }

        // Cannot report your own behavior - determine who is being reported
        var reportedUserId = appointment.OrganizerUserId == request.UserId
            ? appointment.ParticipantUserId
            : appointment.OrganizerUserId;

        // Generate report ID
        var reportId = Guid.NewGuid().ToString();

        // Publish moderation event for NotificationService/Admin to handle
        await _publishEndpoint.Publish(new AppointmentReportedIntegrationEvent
        {
            ReportId = reportId,
            AppointmentId = request.AppointmentId,
            ReportedByUserId = request.UserId!,
            ReportedUserId = reportedUserId,
            Reason = request.Reason,
            Details = request.Details,
            ReportedAt = DateTime.UtcNow
        }, cancellationToken);

        Logger.LogInformation(
            "Appointment report {ReportId} created for appointment {AppointmentId}",
            reportId,
            request.AppointmentId);

        var response = new ReportAppointmentResponse(
            reportId,
            request.AppointmentId,
            "Pending",
            DateTimeOffset.UtcNow,
            "Your report has been submitted and will be reviewed by our moderation team.");

        return Success(response, "Report submitted successfully");
    }
}
