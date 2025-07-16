using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record SkillVerifiedDomainEvent(
    string SkillId,
    string UserId,
    string VerifiedByUserId,
    string VerificationMethod,
    DateTime VerificationDate) : DomainEvent;
