using CQRS.Interfaces;

namespace Events.Domain.Skill;

// ============================================================================
// SKILL EXPORT/IMPORT EVENTS
// ============================================================================

public record SkillDataExportedDomainEvent(
    string ExportId,
    string UserId,
    List<string> ExportedSkillIds,
    string ExportFormat,
    DateTime ExportedAt) : DomainEvent;
