using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record SkillCategoryDeletedDomainEvent(
    string CategoryId,
    string Name,
    string DeletedByUserId,
    string Reason) : DomainEvent;
