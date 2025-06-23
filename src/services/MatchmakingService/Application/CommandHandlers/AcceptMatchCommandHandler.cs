using CQRS.Handlers;
using Infrastructure.Models;
using MatchmakingService.Application.Commands;
using MatchmakingService.Domain.Entities;
using MatchmakingService.Domain.Events;
using MediatR;
using Microsoft.EntityFrameworkCore;
using EventSourcing;

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
        try
        {
            var match = await _dbContext.Matches
                .FirstOrDefaultAsync(m => m.Id == request.MatchId && !m.IsDeleted, cancellationToken);

            if (match == null)
            {
                return Error("Match not found");
            }

            if (match.OfferingUserId != request.UserId && match.RequestingUserId != request.UserId)
            {
                return Error("You are not authorized to accept this match");
            }

            if (match.Status != MatchStatus.Pending)
            {
                return Error($"Cannot accept match in {match.Status} status");
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
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error accepting match {MatchId}", request.MatchId);
            return Error("An error occurred while accepting the match");
        }
    }
}
