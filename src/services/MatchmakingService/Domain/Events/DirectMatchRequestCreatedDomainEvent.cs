using CQRS.Interfaces;

namespace MatchmakingService.Domain.Events;

public record DirectMatchRequestCreatedDomainEvent(
    string RequestId,
    string RequesterId,
    string TargetUserId,
    string SkillId,
    string Message,
    bool IsLearningMode) : DomainEvent;
