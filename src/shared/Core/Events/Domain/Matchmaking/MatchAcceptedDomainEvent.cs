using CQRS.Interfaces;

namespace Events.Domain.Matchmaking;

public record MatchAcceptedDomainEvent(
    string MatchId,
    string OfferingUserId,
    string RequestingUserId,
    DateTime AcceptedAt) : DomainEvent;
