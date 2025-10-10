using CQRS.Handlers;
using MatchmakingService.Application.Commands;
using MatchmakingService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using EventSourcing;
using Events.Domain.Matchmaking;
using CQRS.Models;
using Contracts.Matchmaking.Responses;
using Core.Common.Exceptions;

namespace MatchmakingService.Application.CommandHandlers;

public class CompleteMatchCommandHandler(
    MatchmakingDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    ILogger<CompleteMatchCommandHandler> logger)
    : BaseCommandHandler<CompleteMatchCommand, CompleteMatchResponse>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;

    public override async Task<ApiResponse<CompleteMatchResponse>> Handle(
        CompleteMatchCommand request,
        CancellationToken cancellationToken)
    {
        var match = await _dbContext.Matches
            .Include(m => m.AcceptedMatchRequest)
            .FirstOrDefaultAsync(m => m.Id == request.MatchId && !m.IsDeleted, cancellationToken);

        if (match == null)
        {
            return Error("Match not found", ErrorCodes.ResourceNotFound);
        }

        if (match.OfferingUserId != request.UserId && match.RequestingUserId != request.UserId)
        {
            return Error("You are not authorized to complete this match", ErrorCodes.InsufficientPermissions);
        }

        if (match.Status != MatchStatus.Accepted)
        {
            return Error($"Cannot complete match in {match.Status} status", ErrorCodes.InvalidOperation);
        }

        if (request.Rating.HasValue)
        {
            if (match.OfferingUserId == request.UserId)
            {
                match.RateByOffering(request.Rating.Value);
            }
            else
            {
                match.RateByRequesting(request.Rating.Value);
            }
        }

        match.Complete(request.CompletionNotes);
        await _dbContext.SaveChangesAsync(cancellationToken);

        await _eventPublisher.Publish(new MatchCompletedDomainEvent(
            match.Id,
            match.OfferingUserId,
            match.RequestingUserId,
            match.AcceptedMatchRequest.SessionDurationMinutes ?? 60,
            match.CompletedAt!.Value), cancellationToken);

        return Success(new CompleteMatchResponse(
            match.Id,
            match.Status == MatchStatus.Completed,
            match.CompletedAt!.Value));
    }
}