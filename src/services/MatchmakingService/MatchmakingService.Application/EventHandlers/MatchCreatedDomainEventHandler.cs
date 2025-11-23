using CQRS.Handlers;
using Events.Domain.Matchmaking;
using Events.Integration.Communication;

using MediatR;
using Microsoft.Extensions.Logging;

namespace MatchmakingService.Application.EventHandlers;

public class MatchCreatedDomainEventHandler(
    IPublisher publisher,
    ILogger<MatchCreatedDomainEventHandler> logger)
    : BaseDomainEventHandler<MatchCreatedDomainEvent>(logger)
{
    private readonly IPublisher _publisher = publisher;

    protected override async Task HandleDomainEvent(MatchCreatedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Publish integration event for other services
        await _publisher.Publish(new MatchFoundEvent(
            domainEvent.MatchId,
            $"{domainEvent.OfferedSkillId}:{domainEvent.RequestedSkillId}",
            domainEvent.RequestingUserId,
            domainEvent.OfferingUserId), cancellationToken);

        Logger.LogInformation("Match created: {MatchId} with compatibility score {Score}",
            domainEvent.MatchId, domainEvent.CompatibilityScore);
    }
}
