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

public record SkillResourceAddedDomainEvent(
    string ResourceId,
    string SkillId,
    string Title,
    string Type) : DomainEvent;