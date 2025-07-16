using CQRS.Interfaces;

namespace Events.Domain.Skill;

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
