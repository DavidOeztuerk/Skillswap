using CQRS.Interfaces;

namespace MatchmakingService.Domain.Events;

public record MatchAcceptedDomainEvent(
    string MatchId,
    string OfferingUserId,
    string RequestingUserId,
    DateTime AcceptedAt) : DomainEvent;
