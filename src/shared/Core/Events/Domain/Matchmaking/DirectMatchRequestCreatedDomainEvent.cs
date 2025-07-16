using CQRS.Interfaces;

namespace Events.Domain.Matchmaking;

public record DirectMatchRequestCreatedDomainEvent(
    string RequestId,
    string RequesterId,
    string TargetUserId,
    string SkillId,
    string Message,
    bool IsLearningMode) : DomainEvent;
