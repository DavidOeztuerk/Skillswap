using CQRS.Interfaces;

namespace Events.Domain.Matchmaking;

public record DirectMatchRequestRejectedDomainEvent(
    string RequestId,
    string RequesterId,
    string TargetUserId,
    string SkillId,
    string? Reason) : DomainEvent;
