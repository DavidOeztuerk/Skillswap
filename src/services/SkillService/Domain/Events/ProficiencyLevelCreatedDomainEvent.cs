using CQRS.Interfaces;

namespace SkillService.Domain.Events;

// ============================================================================
// PROFICIENCY LEVEL EVENTS
// ============================================================================

public record ProficiencyLevelCreatedDomainEvent(
    string LevelId,
    string Level,
    int Rank,
    string CreatedByUserId) : DomainEvent;
