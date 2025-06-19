using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record SkillMatchCompletedDomainEvent(
    string MatchId,
    string OfferedSkillId,
    string RequestedSkillId,
    string OfferingUserId,
    string RequestingUserId,
    int SessionDurationMinutes,
    string SessionType) : DomainEvent;
