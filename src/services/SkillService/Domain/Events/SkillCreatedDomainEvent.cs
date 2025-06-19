using CQRS.Interfaces;

namespace SkillService.Domain.Events;

// ============================================================================
// SKILL LIFECYCLE EVENTS
// ============================================================================

public record SkillCreatedDomainEvent(
    string SkillId,
    string UserId,
    string Name,
    string Description,
    bool IsOffering,
    string SkillCategoryId,
    string ProficiencyLevelId) : DomainEvent;
