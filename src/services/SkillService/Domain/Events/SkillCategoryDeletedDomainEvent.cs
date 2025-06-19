using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record SkillCategoryDeletedDomainEvent(
    string CategoryId,
    string Name,
    string DeletedByUserId,
    string Reason) : DomainEvent;
