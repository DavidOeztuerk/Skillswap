using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record SkillDataImportedDomainEvent(
    string ImportId,
    string UserId,
    int ImportedSkillCount,
    int FailedImportCount,
    string ImportSource,
    DateTime ImportedAt) : DomainEvent;