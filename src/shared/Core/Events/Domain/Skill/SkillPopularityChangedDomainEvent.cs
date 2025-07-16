using CQRS.Interfaces;

namespace Events.Domain.Skill;

// ============================================================================
// SKILL ANALYTICS EVENTS
// ============================================================================

public record SkillPopularityChangedDomainEvent(
    string SkillId,
    string SkillName,
    int OldViewCount,
    int NewViewCount,
    int OldMatchCount,
    int NewMatchCount,
    double PopularityScore) : DomainEvent;
