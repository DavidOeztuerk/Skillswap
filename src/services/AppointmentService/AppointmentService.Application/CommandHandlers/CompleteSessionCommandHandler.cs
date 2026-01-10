using AppointmentService.Application.Commands;
using AppointmentService.Domain.Entities;
using AppointmentService.Domain.Enums;
using AppointmentService.Domain.Repositories;
using CQRS.Handlers;
using CQRS.Models;
using Contracts.Appointment.Responses;
using Contracts.User.Responses;
using Infrastructure.Communication;
using Events.Domain.Appointment;
using Microsoft.Extensions.Logging;
using EventSourcing;
using Core.Common.Exceptions;
using MassTransit;
using Events.Integration.Appointment;

namespace AppointmentService.Application.CommandHandlers;

public class CompleteSessionCommandHandler(
    IAppointmentUnitOfWork unitOfWork,
    IDomainEventPublisher eventPublisher,
    IPublishEndpoint publishEndpoint,
    IServiceCommunicationManager serviceCommunication,
    ILogger<CompleteSessionCommandHandler> logger)
    : BaseCommandHandler<CompleteSessionCommand, SessionStatusResponse>(logger)
{
    private readonly IAppointmentUnitOfWork _unitOfWork = unitOfWork;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;
    private readonly IServiceCommunicationManager _serviceCommunication = serviceCommunication;

    public override async Task<ApiResponse<SessionStatusResponse>> Handle(
        CompleteSessionCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation("Completing session: {SessionAppointmentId}", request.SessionAppointmentId);

            var appointment = await _unitOfWork.SessionAppointments.GetWithSeriesAsync(request.SessionAppointmentId, cancellationToken);

            if (appointment == null)
                return Error("Session appointment not found", ErrorCodes.ResourceNotFound);

            // Verify user is participant or organizer
            if (appointment.OrganizerUserId != request.UserId && appointment.ParticipantUserId != request.UserId)
                return Error("User is not part of this session", ErrorCodes.Unauthorized);

            // Complete session
            if (request.IsNoShow)
            {
                appointment.Status = SessionAppointmentStatus.NoShow;
                appointment.IsNoShow = true;
                appointment.NoShowUserIds = request.UserId;
            }
            else
            {
                appointment.Status = SessionAppointmentStatus.Completed;
            }

            appointment.CompletedAt = DateTime.UtcNow;
            appointment.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Publish domain event
            await _eventPublisher.Publish(
                new SessionCompletedEvent(
                    appointment.Id,
                    appointment.SessionSeriesId,
                    appointment.SessionSeries?.ConnectionId ?? string.Empty,
                    appointment.OrganizerUserId,
                    appointment.ParticipantUserId,
                    appointment.DurationMinutes),
                cancellationToken);

            // Fetch organizer and participant details from UserService
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
            await _publishEndpoint.Publish(new SessionCompletedIntegrationEvent(
                appointment.Id,
                appointment.SessionSeriesId,
                appointment.OrganizerUserId,
                appointment.ParticipantUserId,
                organizerName,
                organizerEmail,
                participantName,
                participantEmail,
                appointment.Title,
                appointment.ScheduledDate,
                appointment.CompletedAt.Value,
                request.IsNoShow,
                request.NoShowReason,
                appointment.PaymentAmount,
                appointment.Currency,
                DateTime.UtcNow), cancellationToken);

            Logger.LogInformation("Session completed successfully: {SessionAppointmentId}", request.SessionAppointmentId);

            return Success(new SessionStatusResponse(
                appointment.Id,
                appointment.Status.ToString(),
                appointment.CompletedAt,
                appointment.MeetingLink),
                request.IsNoShow ? "Session marked as no-show" : "Session completed successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error completing session: {SessionAppointmentId}", request.SessionAppointmentId);
            return Error("Failed to complete session", ErrorCodes.InternalError);
        }
    }
}
