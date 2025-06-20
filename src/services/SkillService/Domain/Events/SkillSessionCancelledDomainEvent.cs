using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record SkillSessionCancelledDomainEvent(
    string SessionId,
    string SkillId,
    string CancelledByUserId,
    string Reason,
    DateTime CancelledAt) : DomainEvent;
