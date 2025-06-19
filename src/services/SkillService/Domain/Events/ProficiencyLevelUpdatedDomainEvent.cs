using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record ProficiencyLevelUpdatedDomainEvent(
    string LevelId,
    string Level,
    Dictionary<string, string> ChangedFields,
    string UpdatedByUserId) : DomainEvent;
