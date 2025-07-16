using CQRS.Interfaces;

namespace Events.Domain.Matchmaking;

public record MatchRejectedDomainEvent(
    string MatchId,
    string RejectedByUserId,
    string? Reason) : DomainEvent;
