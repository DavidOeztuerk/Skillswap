using CQRS.Interfaces;

namespace SkillService.Domain.Events;

// ============================================================================
// SKILL LEARNING EVENTS
// ============================================================================

public record SkillLearningPathGeneratedDomainEvent(
    string TargetSkillId,
    string UserId,
    List<string> LearningStepSkillIds,
    int EstimatedTotalHours) : DomainEvent;
