using CQRS.Interfaces;

namespace Events.Domain.Matchmaking;

public record MatchCompletedDomainEvent(
    string MatchId,
    string OfferingUserId,
    string RequestingUserId,
    int? SessionDurationMinutes,
    DateTime CompletedAt) : DomainEvent;
