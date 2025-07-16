using CQRS.Interfaces;

namespace Events.Domain.Skill;

// ============================================================================
// SKILL CATEGORY EVENTS
// ============================================================================

public record SkillCategoryCreatedDomainEvent(
    string SkillCategoryId,
    string ProficiencyLevelId,
    string Name,
    string? Description,
    string CreatedByUserId) : DomainEvent;
