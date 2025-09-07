using CQRS.Handlers;
using MatchmakingService.Application.Commands;
using MatchmakingService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using EventSourcing;
using Contracts.Matchmaking.Responses;
using Events.Domain.Matchmaking;
using CQRS.Models;
using Core.Common.Exceptions;

namespace MatchmakingService.Application.CommandHandlers;

public class AcceptMatchCommandHandler(
    MatchmakingDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    ILogger<AcceptMatchCommandHandler> logger)
    : BaseCommandHandler<AcceptMatchCommand, AcceptMatchResponse>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<AcceptMatchResponse>> Handle(
        AcceptMatchCommand request,
        CancellationToken cancellationToken)
    {
        {
            var match = await _dbContext.Matches
                .FirstOrDefaultAsync(m => m.Id == request.MatchId && !m.IsDeleted, cancellationToken);

            if (match == null)
            {
                return Error("Match not found", ErrorCodes.ResourceNotFound);
            }

            if (match.OfferingUserId != request.UserId && match.RequestingUserId != request.UserId)
            {
                return Error("You are not authorized to accept this match", ErrorCodes.InsufficientPermissions);
            }

            if (match.Status != MatchStatus.Pending)
            {
                return Error($"Cannot accept match in {match.Status} status", ErrorCodes.InvalidOperation);
            }

            match.Accept();
            await _dbContext.SaveChangesAsync(cancellationToken);

            // Publish domain event
            await _eventPublisher.Publish(new MatchAcceptedDomainEvent(
                match.Id,
                match.OfferingUserId,
                match.RequestingUserId,
                match.AcceptedAt!.Value), cancellationToken);

            return Success(new AcceptMatchResponse(
                match.Id,
                match.Status,
                match.AcceptedAt!.Value));
        }
    }
}
