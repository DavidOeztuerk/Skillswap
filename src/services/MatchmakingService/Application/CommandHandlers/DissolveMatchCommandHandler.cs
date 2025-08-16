using CQRS.Handlers;
using MatchmakingService.Application.Commands;
using Microsoft.EntityFrameworkCore;
using EventSourcing;
using Events.Domain.Matchmaking;
using CQRS.Models;
using MassTransit;
using Events.Integration.Matchmaking;

namespace MatchmakingService.Application.CommandHandlers;

public class DissolveMatchCommandHandler(
    MatchmakingDbContext dbContext,
    IDomainEventPublisher eventPublisher,
    IPublishEndpoint publishEndpoint,
    ILogger<DissolveMatchCommandHandler> logger)
    : BaseCommandHandler<DissolveMatchCommand, DissolveMatchResponse>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;

    public override async Task<ApiResponse<DissolveMatchResponse>> Handle(
        DissolveMatchCommand request,
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

            // Check authorization - both users can dissolve the match
            if (match.OfferingUserId != request.UserId && match.RequestingUserId != request.UserId)
            {
                return Error("You are not authorized to dissolve this match");
            }

            // Only active matches can be dissolved
            if (!match.IsActive)
            {
                return Error($"Cannot dissolve match in {match.Status} status");
            }

            // Dissolve the match
            match.Dissolve(request.Reason);
            await _dbContext.SaveChangesAsync(cancellationToken);

            // Publish domain event
            await _eventPublisher.Publish(new MatchDissolvedDomainEvent(
                match.Id,
                match.OfferingUserId,
                match.RequestingUserId,
                request.Reason,
                match.DissolvedAt!.Value), cancellationToken);

            // Publish integration event to cancel all future appointments
            await _publishEndpoint.Publish(new MatchDissolvedIntegrationEvent(
                match.Id,
                match.OfferingUserId,
                match.RequestingUserId,
                request.Reason), cancellationToken);

            Logger.LogInformation("Match {MatchId} dissolved by user {UserId} with reason: {Reason}",
                request.MatchId, request.UserId, request.Reason);

            return Success(new DissolveMatchResponse(
                match.Id,
                match.Status,
                match.DissolvedAt!.Value));
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error dissolving match {MatchId}", request.MatchId);
            return Error("An error occurred while dissolving the match");
        }
    }
}