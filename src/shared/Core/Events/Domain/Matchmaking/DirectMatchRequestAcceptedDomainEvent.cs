using CQRS.Interfaces;

namespace Events.Domain.Matchmaking;

public record DirectMatchRequestAcceptedDomainEvent(
    string RequestId,
    string MatchId,
    string RequesterId,
    string TargetUserId,
    string SkillId) : DomainEvent;
