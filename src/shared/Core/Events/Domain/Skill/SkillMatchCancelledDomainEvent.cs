using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record SkillMatchCancelledDomainEvent(
    string MatchId,
    string CancelledByUserId,
    string Reason,
    string MatchStatus) : DomainEvent;
