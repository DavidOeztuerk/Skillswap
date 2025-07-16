using CQRS.Interfaces;

namespace Events.Domain.Skill;

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
