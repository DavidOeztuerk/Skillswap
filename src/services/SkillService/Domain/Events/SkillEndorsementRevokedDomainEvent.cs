using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record SkillEndorsementRevokedDomainEvent(
    string EndorsementId,
    string SkillId,
    string EndorserUserId,
    string Reason) : DomainEvent;
