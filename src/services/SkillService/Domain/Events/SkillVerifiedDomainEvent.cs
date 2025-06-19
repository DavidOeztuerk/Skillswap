using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record SkillVerifiedDomainEvent(
    string SkillId,
    string UserId,
    string VerifiedByUserId,
    string VerificationMethod,
    DateTime VerificationDate) : DomainEvent;
