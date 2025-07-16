using CQRS.Interfaces;

namespace Events.Domain.Matchmaking;

public record MatchExpiredDomainEvent(
    string MatchId,
    string Reason) : DomainEvent;