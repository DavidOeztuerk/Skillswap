using CQRS.Interfaces;

namespace MatchmakingService.Domain.Events;

public record DirectMatchRequestAcceptedDomainEvent(
    string RequestId,
    string MatchId,
    string RequesterId,
    string TargetUserId,
    string SkillId) : DomainEvent;
