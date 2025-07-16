using CQRS.Interfaces;

namespace Events.Domain.Matchmaking;

public record MatchCreatedDomainEvent(
    string MatchId,
    string OfferedSkillId,
    string RequestedSkillId,
    string OfferingUserId,
    string RequestingUserId,
    double CompatibilityScore) : DomainEvent;
