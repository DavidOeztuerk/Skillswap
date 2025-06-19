using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record SkillDeactivatedDomainEvent(
    string SkillId,
    string UserId,
    string Name,
    string? Reason) : DomainEvent;
