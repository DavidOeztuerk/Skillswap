using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record SkillMatchCompletedDomainEvent(
    string MatchId,
    string OfferedSkillId,
    string RequestedSkillId,
    string OfferingUserId,
    string RequestingUserId,
    int SessionDurationMinutes,
    string SessionType) : DomainEvent;
