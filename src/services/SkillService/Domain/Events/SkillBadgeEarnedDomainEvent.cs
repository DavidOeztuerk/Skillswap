using CQRS.Interfaces;

namespace SkillService.Domain.Events;

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
