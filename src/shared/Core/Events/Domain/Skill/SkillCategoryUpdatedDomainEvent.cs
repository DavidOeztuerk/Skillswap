using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record SkillCategoryUpdatedDomainEvent(
    string CategoryId,
    string Name,
    Dictionary<string, string> ChangedFields,
    string UpdatedByUserId) : DomainEvent;
