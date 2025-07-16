using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record SkillResourceUpdatedDomainEvent(
    string ResourceId,
    string SkillId,
    Dictionary<string, string> ChangedFields) : DomainEvent;
