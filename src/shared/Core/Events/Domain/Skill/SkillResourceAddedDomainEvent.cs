using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record SkillResourceAddedDomainEvent(
    string ResourceId,
    string SkillId,
    string Title,
    string Type) : DomainEvent;
