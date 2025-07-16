using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record SkillResourceDeletedDomainEvent(
    string ResourceId,
    string SkillId,
    string DeletedByUserId,
    string Reason) : DomainEvent;
