using CQRS.Interfaces;

namespace SkillService.Domain.Events;

// ============================================================================
// SKILL CATEGORY EVENTS
// ============================================================================

public record SkillCategoryCreatedDomainEvent(
    string SkillCategoryId,
    string ProficiencyLevelId,
    string Name,
    string? Description,
    string CreatedByUserId) : DomainEvent;
