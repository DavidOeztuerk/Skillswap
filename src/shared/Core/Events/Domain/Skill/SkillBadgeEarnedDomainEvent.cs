using CQRS.Interfaces;

namespace Events.Domain.Skill;

// ============================================================================
// SKILL BADGE AND ACHIEVEMENT EVENTS
// ============================================================================

public record SkillBadgeEarnedDomainEvent(
    string BadgeId,
    string SkillId,
    string UserId,
    string BadgeType,
    string Criteria,
    DateTime EarnedAt) : DomainEvent;
