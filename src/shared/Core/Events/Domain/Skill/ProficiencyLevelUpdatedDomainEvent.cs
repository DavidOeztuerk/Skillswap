using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record ProficiencyLevelUpdatedDomainEvent(
    string LevelId,
    string Level,
    Dictionary<string, string> ChangedFields,
    string UpdatedByUserId) : DomainEvent;
