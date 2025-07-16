using CQRS.Interfaces;

namespace Events.Domain.Skill;

// ============================================================================
// PROFICIENCY LEVEL EVENTS
// ============================================================================

public record ProficiencyLevelCreatedDomainEvent(
    string LevelId,
    string Level,
    int Rank,
    string CreatedByUserId) : DomainEvent;
