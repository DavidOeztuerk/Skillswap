using CQRS.Interfaces;

namespace SkillService.Domain.Events;

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
