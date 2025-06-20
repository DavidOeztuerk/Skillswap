using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record SkillDataImportedDomainEvent(
    string ImportId,
    string UserId,
    int ImportedSkillCount,
    int FailedImportCount,
    string ImportSource,
    DateTime ImportedAt) : DomainEvent;