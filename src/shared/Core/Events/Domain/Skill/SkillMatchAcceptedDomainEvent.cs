using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record SkillMatchAcceptedDomainEvent(
    string MatchId,
    string OfferedSkillId,
    string RequestedSkillId,
    string OfferingUserId,
    string RequestingUserId) : DomainEvent;
