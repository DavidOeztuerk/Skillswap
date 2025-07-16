using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record SkillDeactivatedDomainEvent(
    string SkillId,
    string UserId,
    string Name,
    string? Reason) : DomainEvent;
