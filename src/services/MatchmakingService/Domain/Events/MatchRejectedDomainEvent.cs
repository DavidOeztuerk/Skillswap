using CQRS.Interfaces;

namespace MatchmakingService.Domain.Events;

public record MatchRejectedDomainEvent(
    string MatchId,
    string RejectedByUserId,
    string? Reason) : DomainEvent;
