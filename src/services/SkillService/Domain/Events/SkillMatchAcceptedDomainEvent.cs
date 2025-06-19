using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record SkillMatchAcceptedDomainEvent(
    string MatchId,
    string OfferedSkillId,
    string RequestedSkillId,
    string OfferingUserId,
    string RequestingUserId) : DomainEvent;
