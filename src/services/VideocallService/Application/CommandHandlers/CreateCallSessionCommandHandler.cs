using CQRS.Handlers;
using Infrastructure.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;
using VideocallService.Application.Commands;
using VideocallService.Domain.Entities;
using VideocallService.Domain.Events;
using EventSourcing;

namespace VideocallService.Application.CommandHandlers;

public class CreateCallSessionCommandHandler(
    VideoCallDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    ILogger<CreateCallSessionCommandHandler> logger)
    : BaseCommandHandler<CreateCallSessionCommand, CreateCallSessionResponse>(logger)
{
    private readonly VideoCallDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<CreateCallSessionResponse>> Handle(
        CreateCallSessionCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Check if users have an active call already
            var existingActiveCall = await _dbContext.VideoCallSessions
                .FirstOrDefaultAsync(s =>
                    (s.InitiatorUserId == request.UserId || s.ParticipantUserId == request.UserId ||
                     s.InitiatorUserId == request.ParticipantUserId || s.ParticipantUserId == request.ParticipantUserId) &&
                    s.Status == CallStatus.Active &&
                    !s.IsDeleted, cancellationToken);

            if (existingActiveCall != null)
            {
                return Error("One of the participants is already in an active call");
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

            _dbContext.VideoCallSessions.Add(session);
            await _dbContext.SaveChangesAsync(cancellationToken);

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
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error creating call session");
            return Error("An error occurred while creating the call session");
        }
    }
}
