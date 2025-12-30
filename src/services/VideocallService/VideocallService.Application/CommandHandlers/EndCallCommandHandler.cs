using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using VideocallService.Application.Commands;
using VideocallService.Domain.Repositories;
using VideocallService.Domain.Entities;
using EventSourcing;
using Events.Domain.VideoCall;
using Events.Integration.VideoCall;
using Contracts.VideoCall.Responses;
using Core.Common.Exceptions;
using Infrastructure.Communication;
using Contracts.Appointment.Responses;
using MassTransit;

namespace VideocallService.Application.CommandHandlers;

public class EndCallCommandHandler(
    IVideocallUnitOfWork unitOfWork,
    IDomainEventPublisher eventPublisher,
    IPublishEndpoint publishEndpoint,
    IServiceCommunicationManager serviceCommunication,
    ILogger<EndCallCommandHandler> logger)
    : BaseCommandHandler<EndCallCommand, EndCallResponse>(logger)
{
    private readonly IVideocallUnitOfWork _unitOfWork = unitOfWork;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;
    private readonly IServiceCommunicationManager _serviceCommunication = serviceCommunication;

    public override async Task<ApiResponse<EndCallResponse>> Handle(
        EndCallCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation("⏹️ [EndCall] Ending session {SessionId}", request.SessionId);

            var session = await _unitOfWork.VideoCallSessions
                .GetByIdWithParticipantsAsync(request.SessionId, cancellationToken);

            if (session == null)
            {
                Logger.LogWarning("⚠️ [EndCall] Session not found: {SessionId}", request.SessionId);
                return Error("Call session not found", ErrorCodes.ResourceNotFound);
            }

            if (session.Status == CallStatus.Completed || session.Status == CallStatus.Cancelled)
            {
                Logger.LogWarning("⚠️ [EndCall] Session {SessionId} is already {Status}", request.SessionId, session.Status);
                return Error($"Call is already {session.Status.ToString().ToLower()}", ErrorCodes.BusinessRuleViolation);
            }

            // Verify user has permission to end the call (must be initiator or participant)
            if (session.InitiatorUserId != request.UserId && session.ParticipantUserId != request.UserId)
            {
                Logger.LogWarning("⚠️ [EndCall] User {UserId} not authorized to end session {SessionId}",
                    request.UserId, request.SessionId);
                return Error("You are not authorized to end this call", ErrorCodes.InsufficientPermissions);
            }

            DateTime? appointmentEndTime = null;

            if (!string.IsNullOrEmpty(session.AppointmentId))
            {
                try
                {
                    var appointment = await _serviceCommunication.GetAsync<GetAppointmentDetailsResponse>(
                        "AppointmentService",
                        $"/api/appointments/{session.AppointmentId}");

                    if (appointment != null)
                    {
                        appointmentEndTime = appointment.ScheduledDate.DateTime.AddMinutes(appointment.DurationMinutes);
                        Logger.LogInformation("📅 [EndCall] Appointment ends at {EndTime}", appointmentEndTime);
                    }
                }
                catch (Exception ex)
                {
                    Logger.LogWarning(ex, "⚠️ [EndCall] Could not fetch appointment {AppointmentId}, will complete session",
                        session.AppointmentId);
                }
            }

            var endedAt = DateTime.UtcNow;

            session.Leave(appointmentEndTime);
            session.EndReason = "User left call";
            session.ActualDurationMinutes = request.DurationSeconds / 60;
            session.QualityRating = request.Rating;
            session.SessionNotes = request.Feedback;
            session.UpdatedAt = endedAt;
            session.UpdatedBy = request.UserId;

            Logger.LogInformation("⏹️ [EndCall] Session {SessionId} status set to {Status}",
                request.SessionId, session.Status);

            // Mark all active participants as left
            var activeParticipants = session.Participants.Where(p => p.LeftAt == null).ToList();
            foreach (var participant in activeParticipants)
            {
                participant.LeftAt = endedAt;
                participant.UpdatedAt = endedAt;
                participant.UpdatedBy = request.UserId;
                await _unitOfWork.CallParticipants.UpdateAsync(participant, cancellationToken);
            }

            await _unitOfWork.VideoCallSessions.UpdateAsync(session, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Publish domain event
            var participantIds = new List<string> { session.InitiatorUserId };
            if (!string.IsNullOrEmpty(session.ParticipantUserId))
            {
                participantIds.Add(session.ParticipantUserId);
            }

            await _eventPublisher.Publish(new CallSessionEndedDomainEvent(
                session.Id.ToString(),
                session.RoomId,
                participantIds,
                endedAt,
                session.ActualDurationMinutes ?? 0,
                session.EndReason), cancellationToken);

            // Publish integration event for NotificationService and analytics
            // Note: Chat messages are now handled by NotificationService, so messageCount is 0
            await _publishEndpoint.Publish(new CallSessionEndedIntegrationEvent(
                session.Id,
                session.RoomId,
                session.AppointmentId,
                session.MatchId,
                session.InitiatorUserId,
                session.ParticipantUserId,
                request.DurationSeconds,
                session.Participants.Count,
                0, // Chat handled by NotificationService
                session.ScreenShareUsed,
                session.StartedAt ?? session.CreatedAt,
                endedAt,
                DateTime.UtcNow), cancellationToken);

            Logger.LogInformation("📤 [EndCall] Integration event published for session {SessionId}", session.Id);

            Logger.LogInformation("✅ [EndCall] Session {SessionId} ended successfully at {EndedAt}, Duration: {Duration}min",
                request.SessionId, endedAt, session.ActualDurationMinutes);

            return Success(new EndCallResponse(
                session.Id,
                endedAt,
                request.DurationSeconds,
                request.Rating));
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "❌ [EndCall] Error ending session {SessionId}", request.SessionId);
            return Error($"Failed to end call: {ex.Message}");
        }
    }
}
