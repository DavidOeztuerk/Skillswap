using CQRS.Handlers;
using Microsoft.Extensions.Logging;
using VideocallService.Application.Commands;
using VideocallService.Domain.Entities;
using VideocallService.Domain.Repositories;
using EventSourcing;
using Events.Domain.VideoCall;
using Events.Integration.VideoCall;
using Contracts.VideoCall.Responses;
using Contracts.Appointment.Responses;
using CQRS.Models;
using Core.Common.Exceptions;
using MassTransit;
using Infrastructure.Communication;

namespace VideocallService.Application.CommandHandlers;

public class JoinCallCommandHandler(
    IVideocallUnitOfWork unitOfWork,
    IDomainEventPublisher eventPublisher,
    IPublishEndpoint publishEndpoint,
    IServiceCommunicationManager serviceCommunication,
    ILogger<JoinCallCommandHandler> logger)
    : BaseCommandHandler<JoinCallCommand, JoinCallResponse>(logger)
{
    private readonly IVideocallUnitOfWork _unitOfWork = unitOfWork;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;
    private readonly IServiceCommunicationManager _serviceCommunication = serviceCommunication;

    public override async Task<ApiResponse<JoinCallResponse>> Handle(
        JoinCallCommand request,
        CancellationToken cancellationToken)
    {
        // Try to find session by Id first (SessionId GUID)
        var session = await _unitOfWork.VideoCallSessions
            .GetByIdWithParticipantsAsync(request.SessionId, cancellationToken);

        // If not found by Id, try RoomId (short 12-char code that frontend sends)
        if (session == null)
        {
            Logger.LogInformation("🔍 [JoinCall] Session not found by Id, trying RoomId: {RoomId}", request.SessionId);
            session = await _unitOfWork.VideoCallSessions
                .GetByRoomIdAsync(request.SessionId, cancellationToken);

            if (session != null)
            {
                Logger.LogInformation("✅ [JoinCall] Found session by RoomId: {SessionId}", session.Id);
                // Reload with participants
                session = await _unitOfWork.VideoCallSessions
                    .GetByIdWithParticipantsAsync(session.Id, cancellationToken);
            }
        }

        // If still not found, try AppointmentId (for compatibility when joining via appointment)
        if (session == null)
        {
            Logger.LogInformation("🔍 [JoinCall] Session not found by RoomId, trying AppointmentId: {AppointmentId}", request.SessionId);
            var sessions = await _unitOfWork.VideoCallSessions
                .GetSessionsByAppointmentIdAsync(request.SessionId, cancellationToken);

            // KORRIGIERT: Auch "Completed" Sessions finden für Wiedereintritt
            // Priorisierung: Active > Pending > Completed (neueste zuerst)
            session = sessions
                .Where(s => s.Status == CallStatus.Active)
                .OrderByDescending(s => s.CreatedAt)
                .FirstOrDefault();

            if (session == null)
            {
                session = sessions
                    .Where(s => s.Status == CallStatus.Pending)
                    .OrderByDescending(s => s.CreatedAt)
                    .FirstOrDefault();
            }

            // Fallback: Auch abgeschlossene Sessions (werden später reaktiviert wenn Appointment-Zeit noch läuft)
            if (session == null)
            {
                session = sessions
                    .Where(s => s.Status == CallStatus.Completed)
                    .OrderByDescending(s => s.CreatedAt)
                    .FirstOrDefault();

                if (session != null)
                {
                    Logger.LogInformation("🔄 [JoinCall] Found completed session by AppointmentId, will check if reactivatable: {SessionId}", session.Id);
                }
            }

            if (session != null)
            {
                Logger.LogInformation("✅ [JoinCall] Found session by AppointmentId: {SessionId}, Status: {Status}",
                    session.Id, session.Status);
                // Reload with participants
                session = await _unitOfWork.VideoCallSessions
                    .GetByIdWithParticipantsAsync(session.Id, cancellationToken);
            }
        }

        if (session == null)
        {
            Logger.LogWarning("⚠️ [JoinCall] Call session not found for Id/RoomId/AppointmentId: {SessionId}", request.SessionId);
            return Error("Call session not found", ErrorCodes.ResourceNotFound);
        }

        // Cancelled sessions cannot be rejoined
        if (session.Status == CallStatus.Cancelled)
        {
            Logger.LogWarning("⚠️ [JoinCall] Session {SessionId} was cancelled", session.Id);
            return Error("Diese Session wurde abgebrochen", ErrorCodes.BusinessRuleViolation);
        }

        // APPOINTMENT TIME VALIDATION: Check if appointment time has expired
        // This is the PRIMARY check for whether a session can be (re)joined
        if (!string.IsNullOrEmpty(session.AppointmentId))
        {
            try
            {
                var appointment = await _serviceCommunication.GetAsync<GetAppointmentDetailsResponse>(
                    "AppointmentService",
                    $"/api/appointments/{session.AppointmentId}");

                if (appointment != null)
                {
                    var appointmentEndTime = appointment.ScheduledDate.DateTime.AddMinutes(appointment.DurationMinutes);

                    if (DateTime.UtcNow > appointmentEndTime)
                    {
                        Logger.LogWarning("⚠️ [JoinCall] Appointment time has expired for session {SessionId}. " +
                            "EndTime was {EndTime}, current time is {Now}",
                            session.Id, appointmentEndTime, DateTime.UtcNow);

                        // Mark session as completed since time expired
                        session.Status = CallStatus.Completed;
                        session.EndedAt = appointmentEndTime;
                        session.EndReason = "Appointment time expired";
                        await _unitOfWork.VideoCallSessions.UpdateAsync(session, cancellationToken);
                        await _unitOfWork.SaveChangesAsync(cancellationToken);

                        return Error("Die Terminzeit ist abgelaufen. Du kannst diesem Call nicht mehr beitreten.", ErrorCodes.BusinessRuleViolation);
                    }

                    Logger.LogInformation("✅ [JoinCall] Appointment time check passed. " +
                        "EndTime: {EndTime}, TimeRemaining: {TimeRemaining}min",
                        appointmentEndTime, (int)(appointmentEndTime - DateTime.UtcNow).TotalMinutes);

                    // KORRIGIERT: Wenn Session "Completed" aber Appointment-Zeit noch läuft → Session reaktivieren!
                    if (session.Status == CallStatus.Completed)
                    {
                        Logger.LogInformation("🔄 [JoinCall] Reactivating completed session {SessionId} - appointment time still valid",
                            session.Id);
                        session.Status = CallStatus.Pending;
                        session.EndedAt = null;
                        session.EndReason = null;
                        await _unitOfWork.VideoCallSessions.UpdateAsync(session, cancellationToken);
                    }
                }
            }
            catch (Exception ex)
            {
                // Log but don't block - appointment service might be unavailable
                Logger.LogWarning(ex, "⚠️ [JoinCall] Could not validate appointment time for session {SessionId}", session.Id);
            }
        }
        else
        {
            // No AppointmentId - use original logic (completed sessions cannot be rejoined)
            if (session.Status == CallStatus.Completed)
            {
                Logger.LogWarning("⚠️ [JoinCall] Session {SessionId} is already completed (no appointment)", session.Id);
                return Error("Diese Session ist bereits beendet", ErrorCodes.BusinessRuleViolation);
            }
        }

        if (session.InitiatorUserId != request.UserId && session.ParticipantUserId != request.UserId)
        {
            return Error("You are not authorized to join this call", ErrorCodes.InsufficientPermissions);
        }

        // IMPROVED REJOIN LOGIC: Check for ANY existing participant record (active or left)
        var existingParticipant = await _unitOfWork.CallParticipants
            .GetMostRecentParticipantInSessionAsync(session.Id, request.UserId!, cancellationToken);

        CallParticipant participant;
        bool isRejoin = false;

        if (existingParticipant != null)
        {
            // User has a previous participant record - REACTIVATE it
            if (existingParticipant.LeftAt == null)
            {
                // User is still marked as active (duplicate join or reconnect)
                Logger.LogInformation("🔄 [JoinCall] User {UserId} reconnecting (still marked active) in session {SessionId}",
                    request.UserId, session.Id);
            }
            else
            {
                // User previously left - REJOIN by clearing LeftAt
                Logger.LogInformation("🔄 [JoinCall] User {UserId} REJOINING session {SessionId} (previously left at {LeftAt})",
                    request.UserId, session.Id, existingParticipant.LeftAt);
                isRejoin = true;
            }

            // Reactivate the participant
            existingParticipant.LeftAt = null; // Clear LeftAt to mark as active again
            existingParticipant.ConnectionId = request.ConnectionId;
            existingParticipant.CameraEnabled = request.CameraEnabled;
            existingParticipant.MicrophoneEnabled = request.MicrophoneEnabled;
            existingParticipant.DeviceInfo = request.DeviceInfo;
            existingParticipant.UpdatedAt = DateTime.UtcNow;
            existingParticipant.UpdatedBy = request.UserId;

            await _unitOfWork.CallParticipants.UpdateAsync(existingParticipant, cancellationToken);
            participant = existingParticipant;

            Logger.LogInformation("✅ [JoinCall] User {UserId} {Action} in session {SessionId}",
                request.UserId, isRejoin ? "rejoined" : "reconnected", session.Id);
        }
        else
        {
            // FIRST TIME JOIN: Create new participant record
            if (session.ParticipantCount >= session.MaxParticipants)
            {
                return Error("Call is at maximum capacity", ErrorCodes.BusinessRuleViolation);
            }

            participant = new CallParticipant
            {
                SessionId = session.Id,
                UserId = request.UserId!,
                ConnectionId = request.ConnectionId,
                IsInitiator = session.InitiatorUserId == request.UserId,
                CameraEnabled = request.CameraEnabled,
                MicrophoneEnabled = request.MicrophoneEnabled,
                DeviceInfo = request.DeviceInfo,
                CreatedBy = request.UserId
            };

            await _unitOfWork.CallParticipants.CreateAsync(participant, cancellationToken);
            Logger.LogInformation("✅ [JoinCall] New participant created for user {UserId} in session {SessionId}",
                request.UserId, session.Id);
        }

        session.AddParticipant(request.UserId!, request.ConnectionId);

        // Auto-start call if both participants have joined
        if (session.IsPending && session.ParticipantCount >= 2)
        {
            session.Start();
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var joinedAt = DateTime.UtcNow;

        // Publish domain event
        await _eventPublisher.Publish(new ParticipantJoinedCallDomainEvent(
            session.Id,
            request.UserId!,
            request.ConnectionId,
            joinedAt), cancellationToken);

        // Publish integration event for NotificationService
        await _publishEndpoint.Publish(new ParticipantJoinedCallIntegrationEvent(
            session.Id,
            session.RoomId,
            request.UserId!,
            null, // UserName - could fetch from UserService if needed
            null, // UserEmail
            request.CameraEnabled,
            request.MicrophoneEnabled,
            joinedAt,
            DateTime.UtcNow), cancellationToken);

        Logger.LogInformation("📤 [JoinCall] Integration event published for user {UserId} in session {SessionId}",
            request.UserId, session.Id);

        var otherParticipants = session.ConnectedUserIds
            .Where(id => id != request.UserId)
            .ToList();

        return Success(new JoinCallResponse(
            session.Id,
            session.RoomId,
            true,
            otherParticipants));
    }
}

