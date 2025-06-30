using CQRS.Interfaces;

namespace MatchmakingService.Domain.Events;

public record DirectMatchRequestRejectedDomainEvent(
    string RequestId,
    string RequesterId,
    string TargetUserId,
    string SkillId,
    string? Reason) : DomainEvent;
