using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record SkillMatchCancelledDomainEvent(
    string MatchId,
    string CancelledByUserId,
    string Reason,
    string MatchStatus) : DomainEvent;
