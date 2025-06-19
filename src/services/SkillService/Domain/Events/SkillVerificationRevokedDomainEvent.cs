using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record SkillVerificationRevokedDomainEvent(
    string SkillId,
    string UserId,
    string RevokedByUserId,
    string Reason) : DomainEvent;
