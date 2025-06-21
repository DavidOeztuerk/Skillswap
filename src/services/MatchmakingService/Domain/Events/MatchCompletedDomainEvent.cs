using CQRS.Interfaces;

namespace MatchmakingService.Domain.Events;

public record MatchCompletedDomainEvent(
    string MatchId,
    string OfferingUserId,
    string RequestingUserId,
    int? SessionDurationMinutes,
    DateTime CompletedAt) : DomainEvent;
