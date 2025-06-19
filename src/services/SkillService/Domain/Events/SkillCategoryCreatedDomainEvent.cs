using CQRS.Interfaces;

namespace SkillService.Domain.Events;

// ============================================================================
// SKILL CATEGORY EVENTS
// ============================================================================

public record SkillCategoryCreatedDomainEvent(
    string CategoryId,
    string Name,
    string? Description,
    string CreatedByUserId) : DomainEvent;
