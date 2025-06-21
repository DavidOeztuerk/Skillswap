using CQRS.Interfaces;

namespace MatchmakingService.Domain.Events;

public record MatchExpiredDomainEvent(
    string MatchId,
    string Reason) : DomainEvent;