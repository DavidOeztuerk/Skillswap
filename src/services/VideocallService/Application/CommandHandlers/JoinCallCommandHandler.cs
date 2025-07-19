using CQRS.Handlers;
using Infrastructure.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;
using VideocallService.Application.Commands;
using VideocallService.Domain.Entities;
using EventSourcing;
using Events.Domain.VideoCall;

namespace VideocallService.Application.CommandHandlers;

public class JoinCallCommandHandler(
    VideoCallDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    ILogger<JoinCallCommandHandler> logger)
    : BaseCommandHandler<JoinCallCommand, JoinCallResponse>(logger)
{
    private readonly VideoCallDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<JoinCallResponse>> Handle(
        JoinCallCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var session = await _dbContext.VideoCallSessions
                .Include(s => s.Participants)
                .FirstOrDefaultAsync(s => s.Id == request.SessionId && !s.IsDeleted, cancellationToken);

            if (session == null)
            {
                return Error("Call session not found");
            }

            if (session.InitiatorUserId != request.UserId && session.ParticipantUserId != request.UserId)
            {
                return Error("You are not authorized to join this call");
            }

            if (session.ParticipantCount >= session.MaxParticipants)
            {
                return Error("Call is at maximum capacity");
            }

            // Check if user is already in the call
            var existingParticipant = session.Participants
                .FirstOrDefault(p => p.UserId == request.UserId && p.LeftAt == null);

            if (existingParticipant != null)
            {
                return Error("You are already in this call");
            }

            // Add participant
            var participant = new CallParticipant
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

            _dbContext.CallParticipants.Add(participant);
            session.AddParticipant(request.UserId!, request.ConnectionId);

            // Auto-start call if both participants have joined
            if (session.IsPending && session.ParticipantCount >= 2)
            {
                session.Start();
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

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
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error joining call {SessionId}", request.SessionId);
            return Error("An error occurred while joining the call");
        }
    }
}
