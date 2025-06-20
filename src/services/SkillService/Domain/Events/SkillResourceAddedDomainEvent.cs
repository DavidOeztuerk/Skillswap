using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record SkillResourceAddedDomainEvent(
    string ResourceId,
    string SkillId,
    string Title,
    string Type) : DomainEvent;
