using CQRS.Handlers;
using Infrastructure.Models;
using MatchmakingService.Application.Commands;
using MatchmakingService.Domain.Entities;
using MatchmakingService.Domain.Events;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace MatchmakingService.Application.CommandHandlers;

public class RejectMatchCommandHandler(
    MatchmakingDbContext dbContext,
    IPublisher publisher,
    ILogger<RejectMatchCommandHandler> logger)
    : BaseCommandHandler<RejectMatchCommand, RejectMatchResponse>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;
    private readonly IPublisher _publisher = publisher;

    public override async Task<ApiResponse<RejectMatchResponse>> Handle(
        RejectMatchCommand request,
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
                return Error("You are not authorized to reject this match");
            }

            if (match.Status != MatchStatus.Pending)
            {
                return Error($"Cannot reject match in {match.Status} status");
            }

            match.Reject(request.Reason);
            await _dbContext.SaveChangesAsync(cancellationToken);

            // Publish domain event
            await _publisher.Publish(new MatchRejectedDomainEvent(
                match.Id,
                request.UserId!,
                request.Reason), cancellationToken);

            return Success(new RejectMatchResponse(
                match.Id,
                true,
                match.RejectedAt!.Value));
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error rejecting match {MatchId}", request.MatchId);
            return Error("An error occurred while rejecting the match");
        }
    }
}
