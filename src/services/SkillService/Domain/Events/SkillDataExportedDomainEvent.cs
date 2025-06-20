using CQRS.Interfaces;

namespace SkillService.Domain.Events;

// ============================================================================
// SKILL EXPORT/IMPORT EVENTS
// ============================================================================

public record SkillDataExportedDomainEvent(
    string ExportId,
    string UserId,
    List<string> ExportedSkillIds,
    string ExportFormat,
    DateTime ExportedAt) : DomainEvent;
