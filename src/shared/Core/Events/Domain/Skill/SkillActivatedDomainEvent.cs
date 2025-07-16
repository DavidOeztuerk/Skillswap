using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record SkillActivatedDomainEvent(
    string SkillId,
    string UserId,
    string Name) : DomainEvent;
