using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record SkillUpdatedDomainEvent(
    string SkillId,
    string UserId,
    string Name,
    Dictionary<string, string> ChangedFields) : DomainEvent;
