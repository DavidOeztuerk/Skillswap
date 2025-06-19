using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record SkillCategoryUpdatedDomainEvent(
    string CategoryId,
    string Name,
    Dictionary<string, string> ChangedFields,
    string UpdatedByUserId) : DomainEvent;
