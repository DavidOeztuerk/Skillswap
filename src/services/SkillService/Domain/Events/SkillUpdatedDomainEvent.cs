using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record SkillUpdatedDomainEvent(
    string SkillId,
    string UserId,
    string Name,
    Dictionary<string, string> ChangedFields) : DomainEvent;
