using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record SkillVerificationRevokedDomainEvent(
    string SkillId,
    string UserId,
    string RevokedByUserId,
    string Reason) : DomainEvent;
