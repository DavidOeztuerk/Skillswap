using CQRS.Handlers;
using Events.Domain.Matchmaking;
using Microsoft.Extensions.Logging;

namespace MatchmakingService.Application.EventHandlers;

public class MatchAcceptedDomainEventHandler(
    ILogger<MatchAcceptedDomainEventHandler> logger)
    : BaseDomainEventHandler<MatchAcceptedDomainEvent>(logger)
{
    protected override async Task HandleDomainEvent(MatchAcceptedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        Logger.LogInformation("Match accepted: {MatchId} by users {OfferingUserId} and {RequestingUserId}",
            domainEvent.MatchId, domainEvent.OfferingUserId, domainEvent.RequestingUserId);

        // Note: Notifications and appointment creation are handled via MatchAcceptedIntegrationEvent
        // published in AcceptMatchRequestCommandHandler, consumed by NotificationService and AppointmentService

        await Task.CompletedTask;
    }
}
