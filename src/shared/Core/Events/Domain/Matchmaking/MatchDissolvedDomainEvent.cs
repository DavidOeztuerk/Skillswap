using CQRS.Interfaces;

namespace Events.Domain.Matchmaking;

public record MatchDissolvedDomainEvent(
    string MatchId,
    string OfferingUserId,
    string RequestingUserId,
    string? Reason,
    DateTime DissolvedAt) : DomainEvent;