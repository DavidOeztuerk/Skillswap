using CQRS.Handlers;
using Microsoft.Extensions.Logging;
using VideocallService.Application.Commands;
using VideocallService.Domain.Entities;
using VideocallService.Domain.Repositories;
using EventSourcing;
using Events.Domain.VideoCall;
using Events.Integration.VideoCall;
using CQRS.Models;
using Contracts.VideoCall.Responses;
using MassTransit;

namespace VideocallService.Application.CommandHandlers;

public class CreateCallSessionCommandHandler(
    IVideocallUnitOfWork unitOfWork,
    IDomainEventPublisher eventPublisher,
    IPublishEndpoint publishEndpoint,
    ILogger<CreateCallSessionCommandHandler> logger)
    : BaseCommandHandler<CreateCallSessionCommand, CreateCallSessionResponse>(logger)
{
    private readonly IVideocallUnitOfWork _unitOfWork = unitOfWork;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;

    public override async Task<ApiResponse<CreateCallSessionResponse>> Handle(
        CreateCallSessionCommand request,
        CancellationToken cancellationToken)
    {
        // Validate distinct users
        if (request.UserId == request.ParticipantUserId)
        {
            Logger.LogError(
                "❌ [CreateCallSession] Cannot create session: InitiatorUserId and ParticipantUserId are identical. " +
                "UserId={UserId}, ParticipantUserId={ParticipantUserId}",
                request.UserId, request.ParticipantUserId);

            throw new Core.Common.Exceptions.InvalidOperationException(
                "CreateCallSession",
                "SameUserNotAllowed",
                "Initiator and Participant cannot be the same user");
        }

        Logger.LogInformation(
            "✅ [CreateCallSession] User ID mapping - InitiatorUserId: {InitiatorUserId}, ParticipantUserId: {ParticipantUserId}",
            request.UserId, request.ParticipantUserId);

        // Check if initiator has an active call
        var initiatorHasActiveCall = await _unitOfWork.VideoCallSessions
            .HasActiveSessionAsync(request.UserId!, cancellationToken);

        if (initiatorHasActiveCall)
        {
            throw new Core.Common.Exceptions.InvalidOperationException(
                "CreateCallSession",
                "UserAlreadyInCall",
                "Initiator is already in an active call");
        }

        // Check if participant has an active call
        var participantHasActiveCall = await _unitOfWork.VideoCallSessions
            .HasActiveSessionAsync(request.ParticipantUserId, cancellationToken);

        if (participantHasActiveCall)
        {
            throw new Core.Common.Exceptions.InvalidOperationException(
                "CreateCallSession",
                "UserAlreadyInCall",
                "Participant is already in an active call");
        }

        var roomId = Guid.NewGuid().ToString("N")[..12]; // Shorter room ID

        var session = new VideoCallSession
        {
            RoomId = roomId,
            InitiatorUserId = request.UserId!,
            ParticipantUserId = request.ParticipantUserId,
            HostUserId = request.UserId!,  // Host = Initiator (MatchRequester)
            AppointmentId = request.AppointmentId,
            MatchId = request.MatchId,
            IsRecorded = request.IsRecorded,
            MaxParticipants = request.MaxParticipants,
            CreatedBy = request.UserId
        };

        await _unitOfWork.VideoCallSessions.CreateAsync(session, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Publish domain event
        await _eventPublisher.Publish(new CallSessionCreatedDomainEvent(
            session.Id,
            session.RoomId,
            session.InitiatorUserId,
            session.ParticipantUserId,
            session.AppointmentId), cancellationToken);

        // Publish integration event for NotificationService
        await _publishEndpoint.Publish(new CallSessionCreatedIntegrationEvent(
            session.Id,
            session.RoomId,
            session.InitiatorUserId,
            null, // InitiatorName - could fetch from UserService if needed
            null, // InitiatorEmail
            session.ParticipantUserId,
            null, // ParticipantName
            null, // ParticipantEmail
            session.AppointmentId,
            session.MatchId,
            session.CreatedAt,
            DateTime.UtcNow), cancellationToken);

        Logger.LogInformation("📤 [CreateCallSession] Integration event published for session {SessionId}", session.Id);

        return Success(new CreateCallSessionResponse(
            session.Id,
            session.RoomId,
            session.Status,
            session.CreatedAt,
            session.InitiatorUserId,
            session.ParticipantUserId,
            session.AppointmentId));
    }
}
