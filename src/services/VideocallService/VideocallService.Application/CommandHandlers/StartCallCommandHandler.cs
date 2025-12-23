using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using VideocallService.Application.Commands;
using VideocallService.Domain.Repositories;
using VideocallService.Domain.Entities;
using EventSourcing;
using Events.Domain.VideoCall;
using Core.Common.Exceptions;

namespace VideocallService.Application.CommandHandlers;

public class StartCallCommandHandler(
    IVideocallUnitOfWork unitOfWork,
    IDomainEventPublisher eventPublisher,
    ILogger<StartCallCommandHandler> logger)
    : BaseCommandHandler<StartCallCommand, StartCallResponse>(logger)
{
    private readonly IVideocallUnitOfWork _unitOfWork = unitOfWork;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<StartCallResponse>> Handle(
        StartCallCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation("▶️ [StartCall] Starting session {SessionId}", request.SessionId);

            var session = await _unitOfWork.VideoCallSessions
                .GetByIdAsync(request.SessionId, cancellationToken);

            if (session == null)
            {
                Logger.LogWarning("⚠️ [StartCall] Session not found: {SessionId}", request.SessionId);
                return Error("Call session not found", ErrorCodes.ResourceNotFound);
            }

            if (session.Status == CallStatus.Active)
            {
                Logger.LogWarning("⚠️ [StartCall] Session {SessionId} is already active", request.SessionId);
                return Error("Call is already active", ErrorCodes.BusinessRuleViolation);
            }

            if (session.Status == CallStatus.Completed || session.Status == CallStatus.Cancelled)
            {
                Logger.LogWarning("⚠️ [StartCall] Cannot start completed/cancelled session {SessionId}", request.SessionId);
                return Error("Cannot start a completed or cancelled call", ErrorCodes.BusinessRuleViolation);
            }

            // Start the session
            session.Start();
            session.UpdatedAt = DateTime.UtcNow;
            session.UpdatedBy = request.UserId;

            await _unitOfWork.VideoCallSessions.UpdateAsync(session, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Publish domain event
            var participantIds = new List<string> { session.InitiatorUserId };
            if (!string.IsNullOrEmpty(session.ParticipantUserId))
            {
                participantIds.Add(session.ParticipantUserId);
            }

            await _eventPublisher.Publish(new CallSessionStartedDomainEvent(
                session.Id.ToString(),
                session.RoomId,
                participantIds,
                session.StartedAt!.Value), cancellationToken);

            Logger.LogInformation("✅ [StartCall] Session {SessionId} started successfully at {StartedAt}",
                request.SessionId, session.StartedAt);

            return Success(new StartCallResponse(
                session.Id,
                session.Status.ToString(),
                session.StartedAt!.Value));
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "❌ [StartCall] Error starting session {SessionId}", request.SessionId);
            return Error($"Failed to start call: {ex.Message}");
        }
    }
}
