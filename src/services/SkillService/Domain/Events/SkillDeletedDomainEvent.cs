using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record SkillDeletedDomainEvent(
    string SkillId,
    string UserId,
    string Name,
    string Reason) : DomainEvent;
