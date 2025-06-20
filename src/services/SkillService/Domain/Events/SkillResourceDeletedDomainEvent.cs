using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record SkillResourceDeletedDomainEvent(
    string ResourceId,
    string SkillId,
    string DeletedByUserId,
    string Reason) : DomainEvent;
