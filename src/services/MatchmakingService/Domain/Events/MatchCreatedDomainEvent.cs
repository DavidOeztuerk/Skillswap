using CQRS.Interfaces;

namespace MatchmakingService.Domain.Events;

public record MatchCreatedDomainEvent(
    string MatchId,
    string OfferedSkillId,
    string RequestedSkillId,
    string OfferingUserId,
    string RequestingUserId,
    double CompatibilityScore) : DomainEvent;
