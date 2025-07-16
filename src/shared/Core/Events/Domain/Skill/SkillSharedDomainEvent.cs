using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record SkillSharedDomainEvent(
    string SkillId,
    string SkillOwnerId,
    string SharedByUserId,
    string ShareMethod, // "email", "social", "link"
    string? SharedWithEmail) : DomainEvent;
