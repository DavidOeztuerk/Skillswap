using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using VideocallService.Application.Commands;
using VideocallService.Domain.Repositories;
using VideocallService.Domain.Entities;
using EventSourcing;
using Events.Domain.VideoCall;
using Events.Integration.VideoCall;
using Core.Common.Exceptions;
using MassTransit;

namespace VideocallService.Application.CommandHandlers;

public class LeaveCallCommandHandler(
    IVideocallUnitOfWork unitOfWork,
    IDomainEventPublisher eventPublisher,
    IPublishEndpoint publishEndpoint,
    ILogger<LeaveCallCommandHandler> logger)
    : BaseCommandHandler<LeaveCallCommand, LeaveCallResponse>(logger)
{
    private readonly IVideocallUnitOfWork _unitOfWork = unitOfWork;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;

    public override async Task<ApiResponse<LeaveCallResponse>> Handle(
        LeaveCallCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation("🚪 [LeaveCall] User {UserId} leaving session {SessionId}", request.UserId, request.SessionId);

            // Find the active participant
            var participant = await _unitOfWork.CallParticipants
                .GetActiveParticipantInSessionAsync(request.SessionId, request.UserId!, cancellationToken);

            if (participant == null)
            {
                Logger.LogWarning("⚠️ [LeaveCall] No active participant found for user {UserId} in session {SessionId}",
                    request.UserId, request.SessionId);
                return Error("You are not in this call", ErrorCodes.ResourceNotFound);
            }

            // Mark participant as left
            participant.LeftAt = DateTime.UtcNow;
            participant.UpdatedAt = DateTime.UtcNow;
            participant.UpdatedBy = request.UserId;

            await _unitOfWork.CallParticipants.UpdateAsync(participant, cancellationToken);

            // Update session participant count
            var session = await _unitOfWork.VideoCallSessions
                .GetByIdAsync(request.SessionId, cancellationToken);

            if (session != null)
            {
                session.RemoveParticipant(request.UserId!);
                await _unitOfWork.VideoCallSessions.UpdateAsync(session, cancellationToken);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Calculate session duration for this participant
            var sessionDurationMinutes = 0;
            if (participant.LeftAt.HasValue)
            {
                sessionDurationMinutes = (int)(participant.LeftAt.Value - participant.JoinedAt).TotalMinutes;
            }

            var leftAt = DateTime.UtcNow;

            // Publish domain event
            await _eventPublisher.Publish(new ParticipantLeftCallDomainEvent(
                request.SessionId.ToString(),
                request.UserId!,
                leftAt,
                sessionDurationMinutes), cancellationToken);

            // Publish integration event
            await _publishEndpoint.Publish(new ParticipantLeftCallIntegrationEvent(
                request.SessionId,
                session?.RoomId ?? string.Empty,
                request.UserId!,
                null, // UserName
                leftAt,
                "User left call",
                DateTime.UtcNow), cancellationToken);

            Logger.LogInformation("📤 [LeaveCall] Integration event published for user {UserId} leaving session {SessionId}",
                request.UserId, request.SessionId);

            Logger.LogInformation("✅ [LeaveCall] User {UserId} successfully left session {SessionId}",
                request.UserId, request.SessionId);

            return Success(new LeaveCallResponse(
                request.SessionId,
                true,
                participant.LeftAt.Value));
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "❌ [LeaveCall] Error while user {UserId} leaving session {SessionId}",
                request.UserId, request.SessionId);
            return Error($"Failed to leave call: {ex.Message}");
        }
    }
}
