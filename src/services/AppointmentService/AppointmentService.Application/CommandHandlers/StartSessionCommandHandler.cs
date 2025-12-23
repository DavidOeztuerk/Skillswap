using AppointmentService.Application.Commands;
using AppointmentService.Domain.Entities;
using AppointmentService.Domain.Repositories;
using CQRS.Handlers;
using CQRS.Models;
using Contracts.Appointment.Responses;
using Contracts.User.Responses;
using Infrastructure.Communication;
using Events.Domain.Appointment;
using EventSourcing;
using Core.Common.Exceptions;
using Microsoft.Extensions.Logging;
using MassTransit;
using Events.Integration.Appointment;

namespace AppointmentService.Application.CommandHandlers;

public class StartSessionCommandHandler(
    IAppointmentUnitOfWork unitOfWork,
    IDomainEventPublisher eventPublisher,
    IPublishEndpoint publishEndpoint,
    IServiceCommunicationManager serviceCommunication,
    ILogger<StartSessionCommandHandler> logger)
    : BaseCommandHandler<StartSessionCommand, SessionStatusResponse>(logger)
{
    private readonly IAppointmentUnitOfWork _unitOfWork = unitOfWork;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;
    private readonly IServiceCommunicationManager _serviceCommunication = serviceCommunication;

    public override async Task<ApiResponse<SessionStatusResponse>> Handle(
        StartSessionCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation("Starting session: {SessionAppointmentId}", request.SessionAppointmentId);

            var appointment = await _unitOfWork.SessionAppointments.GetByIdAsync(request.SessionAppointmentId, cancellationToken);

            if (appointment == null)
                return Error("Session appointment not found", ErrorCodes.ResourceNotFound);

            // Verify user is participant or organizer
            if (appointment.OrganizerUserId != request.UserId && appointment.ParticipantUserId != request.UserId)
                return Error("User is not part of this session", ErrorCodes.Unauthorized);

            // Check if session can be started (must be Confirmed or PaymentCompleted)
            if (appointment.Status != SessionAppointmentStatus.Confirmed &&
                appointment.Status != SessionAppointmentStatus.PaymentCompleted)
                return Error($"Session status {appointment.Status} does not allow starting", ErrorCodes.InvalidOperation);

            // Start session
            appointment.Status = SessionAppointmentStatus.InProgress;
            appointment.StartedAt = DateTime.UtcNow;
            appointment.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Publish domain event
            await _eventPublisher.Publish(
                new SessionStartedEvent(
                    appointment.Id,
                    appointment.SessionSeriesId,
                    appointment.SessionSeries?.ConnectionId ?? string.Empty,
                    appointment.OrganizerUserId,
                    appointment.ParticipantUserId,
                    appointment.ScheduledDate,
                    appointment.StartedAt.Value,
                    appointment.MeetingLink ?? string.Empty),
                cancellationToken);

            // Fetch organizer and participant details for integration event
            var organizerName = string.Empty;
            var organizerEmail = string.Empty;
            var participantName = string.Empty;
            var participantEmail = string.Empty;

            try
            {
                // Fetch organizer details using typed contract (M2M internal endpoint)
                var organizerResponse = await _serviceCommunication.GetAsync<UserProfileResponse>(
                    "UserService",
                    $"/api/users/internal/{appointment.OrganizerUserId}");

                if (organizerResponse != null)
                {
                    organizerName = $"{organizerResponse.FirstName} {organizerResponse.LastName}".Trim();
                    organizerEmail = organizerResponse.Email ?? string.Empty;
                }

                // Fetch participant details using typed contract (M2M internal endpoint)
                var participantResponse = await _serviceCommunication.GetAsync<UserProfileResponse>(
                    "UserService",
                    $"/api/users/internal/{appointment.ParticipantUserId}");

                if (participantResponse != null)
                {
                    participantName = $"{participantResponse.FirstName} {participantResponse.LastName}".Trim();
                    participantEmail = participantResponse.Email ?? string.Empty;
                }
            }
            catch (Exception ex)
            {
                Logger.LogWarning(ex,
                    "Failed to fetch user details for session {SessionId}, continuing without names/emails",
                    request.SessionAppointmentId);
            }

            // Publish integration event for notifications
            await _publishEndpoint.Publish(new SessionStartedIntegrationEvent(
                appointment.Id,
                appointment.OrganizerUserId,
                appointment.ParticipantUserId,
                organizerName,
                organizerEmail,
                participantName,
                participantEmail,
                appointment.Title,
                appointment.ScheduledDate,
                appointment.MeetingLink ?? string.Empty,
                DateTime.UtcNow), cancellationToken);

            Logger.LogInformation("Session started successfully: {SessionAppointmentId}", request.SessionAppointmentId);

            return Success(new SessionStatusResponse(
                appointment.Id,
                appointment.Status,
                appointment.StartedAt,
                appointment.MeetingLink),
                "Session started successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error starting session: {SessionAppointmentId}", request.SessionAppointmentId);
            return Error("Failed to start session", ErrorCodes.InternalError);
        }
    }
}
