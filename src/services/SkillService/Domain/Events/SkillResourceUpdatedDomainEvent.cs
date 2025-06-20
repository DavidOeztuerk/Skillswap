using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record SkillResourceUpdatedDomainEvent(
    string ResourceId,
    string SkillId,
    Dictionary<string, string> ChangedFields) : DomainEvent;
