using CQRS.Interfaces;

namespace Events.Domain.Skill;

// ============================================================================
// SKILL LEARNING EVENTS
// ============================================================================

public record SkillLearningPathGeneratedDomainEvent(
    string TargetSkillId,
    string UserId,
    List<string> LearningStepSkillIds,
    int EstimatedTotalHours) : DomainEvent;
