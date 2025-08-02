using CQRS.Interfaces;

namespace Events.Domain.Matchmaking;

public record MatchDeletedDomainEvent(
    string MatchId,
    string OfferingUserId,
    string RequestingUserId,
    string OfferedSkillId,
    string RequestedSkillId,
    string Reason) : DomainEvent;