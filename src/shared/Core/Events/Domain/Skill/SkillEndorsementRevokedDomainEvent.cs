using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record SkillEndorsementRevokedDomainEvent(
    string EndorsementId,
    string SkillId,
    string EndorserUserId,
    string Reason) : DomainEvent;
