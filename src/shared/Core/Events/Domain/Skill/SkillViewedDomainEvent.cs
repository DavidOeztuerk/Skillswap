using CQRS.Interfaces;

namespace Events.Domain.Skill;

// ============================================================================
// SKILL INTERACTION EVENTS
// ============================================================================

public record SkillViewedDomainEvent(
    string SkillId,
    string SkillOwnerId,
    string? ViewerUserId,
    string ViewSource,
    int ViewDurationSeconds,
    DateTime ViewedAt) : DomainEvent;
