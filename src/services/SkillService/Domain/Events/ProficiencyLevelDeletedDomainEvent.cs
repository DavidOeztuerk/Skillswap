using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record ProficiencyLevelDeletedDomainEvent(
    string LevelId,
    string Level,
    string DeletedByUserId,
    string Reason) : DomainEvent;
