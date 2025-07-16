using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record SkillSessionCancelledDomainEvent(
    string SessionId,
    string SkillId,
    string CancelledByUserId,
    string Reason,
    DateTime CancelledAt) : DomainEvent;
