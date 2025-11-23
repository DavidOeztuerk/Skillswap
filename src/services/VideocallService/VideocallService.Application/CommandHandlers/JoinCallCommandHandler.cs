using CQRS.Handlers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VideocallService.Application.Commands;
using VideocallService.Domain.Entities;
using VideocallService.Domain.Repositories;
using EventSourcing;
using Events.Domain.VideoCall;
using Contracts.VideoCall.Responses;
using CQRS.Models;
using Core.Common.Exceptions;

namespace VideocallService.Application.CommandHandlers;

public class JoinCallCommandHandler(
    IVideocallUnitOfWork unitOfWork,
    IDomainEventPublisher eventPublisher,
    ILogger<JoinCallCommandHandler> logger)
    : BaseCommandHandler<JoinCallCommand, JoinCallResponse>(logger)
{
    private readonly IVideocallUnitOfWork _unitOfWork = unitOfWork;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

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

            // Get the most recent active or pending session for this appointment
            session = sessions
                .Where(s => s.Status == CallStatus.Pending || s.Status == CallStatus.Active)
                .OrderByDescending(s => s.CreatedAt)
                .FirstOrDefault();

            if (session != null)
            {
                Logger.LogInformation("✅ [JoinCall] Found session by AppointmentId: {SessionId}", session.Id);
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

        if (session.InitiatorUserId != request.UserId && session.ParticipantUserId != request.UserId)
        {
            return Error("You are not authorized to join this call", ErrorCodes.InsufficientPermissions);
        }

        if (session.ParticipantCount >= session.MaxParticipants)
        {
            return Error("Call is at maximum capacity", ErrorCodes.BusinessRuleViolation);
        }

        // IMPROVED REJOIN LOGIC: Check if user is already in the call
        var existingParticipant = await _unitOfWork.CallParticipants
            .GetActiveParticipantInSessionAsync(session.Id, request.UserId!, cancellationToken);

        CallParticipant participant;
        bool isRejoin = false;

        if (existingParticipant != null && existingParticipant.LeftAt == null)
        {
            // User is already actively in the call - this could be:
            // 1. Duplicate join attempt
            // 2. User reconnecting after network issue (but didn't officially leave)
            Logger.LogWarning("⚠️ [JoinCall] User {UserId} already has active participant in session {SessionId}. " +
                "Treating as reconnect/rejoin.", request.UserId, session.Id);

            // REJOIN: Reactivate existing participant instead of creating new one
            existingParticipant.ConnectionId = request.ConnectionId;
            existingParticipant.CameraEnabled = request.CameraEnabled;
            existingParticipant.MicrophoneEnabled = request.MicrophoneEnabled;
            existingParticipant.DeviceInfo = request.DeviceInfo;
            existingParticipant.UpdatedAt = DateTime.UtcNow;
            existingParticipant.UpdatedBy = request.UserId;

            await _unitOfWork.CallParticipants.UpdateAsync(existingParticipant, cancellationToken);
            participant = existingParticipant;
            isRejoin = true;

            Logger.LogInformation("✅ [JoinCall] User {UserId} reactivated in session {SessionId}", request.UserId, session.Id);
        }
        else
        {
            // NEW JOIN: Create new participant record
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

        // Publish domain event
        await _eventPublisher.Publish(new ParticipantJoinedCallDomainEvent(
            session.Id,
            request.UserId!,
            request.ConnectionId,
            DateTime.UtcNow), cancellationToken);

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

