using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record SkillActivatedDomainEvent(
    string SkillId,
    string UserId,
    string Name) : DomainEvent;
