using CQRS.Handlers;
using Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VideocallService.Application.Commands;
using VideocallService.Domain.Entities;
using VideocallService.Domain.Repositories;
using EventSourcing;
using Events.Domain.VideoCall;
using CQRS.Models;
using Core.Common.Exceptions;

namespace VideocallService.Application.CommandHandlers;

public class CreateCallSessionCommandHandler(
    IVideocallUnitOfWork unitOfWork,
    IDomainEventPublisher eventPublisher,
    ILogger<CreateCallSessionCommandHandler> logger)
    : BaseCommandHandler<CreateCallSessionCommand, CreateCallSessionResponse>(logger)
{
    private readonly IVideocallUnitOfWork _unitOfWork = unitOfWork;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<CreateCallSessionResponse>> Handle(
        CreateCallSessionCommand request,
        CancellationToken cancellationToken)
    {
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

            return Success(new CreateCallSessionResponse(
                session.Id,
                session.RoomId,
                session.Status,
                session.CreatedAt));
    }
}
