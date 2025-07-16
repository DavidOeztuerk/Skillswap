using CQRS.Interfaces;

namespace Events.Domain.Skill;

// ============================================================================
// SKILL SESSION EVENTS
// ============================================================================

public record SkillSessionScheduledDomainEvent(
    string SessionId,
    string SkillId,
    string TeacherUserId,
    string LearnerUserId,
    DateTime ScheduledAt,
    int EstimatedDurationMinutes) : DomainEvent;
