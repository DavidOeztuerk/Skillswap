using CQRS.Interfaces;

namespace SkillService.Domain.Events;

// ============================================================================
// SKILL MATCHING EVENTS
// ============================================================================

public record SkillMatchRequestedDomainEvent(
    string MatchId,
    string OfferedSkillId,
    string RequestedSkillId,
    string OfferingUserId,
    string RequestingUserId,
    double CompatibilityScore) : DomainEvent;
