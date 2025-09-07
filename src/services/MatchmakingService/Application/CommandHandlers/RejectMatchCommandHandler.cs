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

public class RejectMatchCommandHandler(
    MatchmakingDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    ILogger<RejectMatchCommandHandler> logger)
    : BaseCommandHandler<RejectMatchCommand, RejectMatchResponse>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<RejectMatchResponse>> Handle(
        RejectMatchCommand request,
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
                return Error("You are not authorized to reject this match", ErrorCodes.InsufficientPermissions);
            }

            if (match.Status != MatchStatus.Pending)
            {
                return Error($"Cannot reject match in {match.Status} status", ErrorCodes.InvalidOperation);
            }

            match.Reject(request.Reason);
            await _dbContext.SaveChangesAsync(cancellationToken);

            // Publish domain event
            await _eventPublisher.Publish(new MatchRejectedDomainEvent(
                match.Id,
                request.UserId!,
                request.Reason), cancellationToken);

            return Success(new RejectMatchResponse(
                match.Id,
                true,
                match.RejectedAt!.Value));
        }
    }
}
