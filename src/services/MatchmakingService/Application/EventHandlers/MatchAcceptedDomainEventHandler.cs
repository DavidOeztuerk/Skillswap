using CQRS.Handlers;
using Events.Domain.Matchmaking;

namespace MatchmakingService.Application.EventHandlers;

public class MatchAcceptedDomainEventHandler(
    ILogger<MatchAcceptedDomainEventHandler> logger)
    : BaseDomainEventHandler<MatchAcceptedDomainEvent>(logger)
{
    protected override async Task HandleDomainEvent(MatchAcceptedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Match accepted: {MatchId} by users {OfferingUserId} and {RequestingUserId}",
            domainEvent.MatchId, domainEvent.OfferingUserId, domainEvent.RequestingUserId);

        // TODO: Send notifications to both users
        // TODO: Create appointment suggestion

        await Task.CompletedTask;
    }
}
