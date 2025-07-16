using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record ProficiencyLevelDeletedDomainEvent(
    string LevelId,
    string Level,
    string DeletedByUserId,
    string Reason) : DomainEvent;
