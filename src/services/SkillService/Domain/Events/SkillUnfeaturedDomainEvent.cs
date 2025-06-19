using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record SkillUnfeaturedDomainEvent(
    string SkillId,
    string SkillName,
    string UnfeaturedByUserId,
    string Reason) : DomainEvent;
