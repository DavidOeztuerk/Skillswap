using CQRS.Handlers;
using Infrastructure.Models;
using MatchmakingService.Application.Commands;
using MatchmakingService.Domain.Entities;
using MatchmakingService.Domain.Events;
using MediatR;
using Microsoft.EntityFrameworkCore;
using EventSourcing;

namespace MatchmakingService.Application.CommandHandlers;

// Application/CommandHandlers/CompleteMatchCommandHandler.cs
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
                return Error("You are not authorized to complete this match");
            }

            if (match.Status != MatchStatus.Accepted)
            {
                return Error($"Cannot complete match in {match.Status} status");
            }

            // Set rating based on who is completing
            if (match.OfferingUserId == request.UserId)
            {
                match.RatingByOffering = request.Rating;
            }
            else
            {
                match.RatingByRequesting = request.Rating;
            }

            match.Complete(request.SessionDurationMinutes, request.CompletionNotes);
            await _dbContext.SaveChangesAsync(cancellationToken);

            // Publish domain event
            await _eventPublisher.Publish(new MatchCompletedDomainEvent(
                match.Id,
                match.OfferingUserId,
                match.RequestingUserId,
                match.SessionDurationMinutes,
                match.CompletedAt!.Value), cancellationToken);

            return Success(new CompleteMatchResponse(
                match.Id,
                match.Status,
                match.CompletedAt!.Value));
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error completing match {MatchId}", request.MatchId);
            return Error("An error occurred while completing the match");
        }
    }
}