using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record SkillDeletedDomainEvent(
    string SkillId,
    string UserId,
    string Name,
    string Reason) : DomainEvent;
