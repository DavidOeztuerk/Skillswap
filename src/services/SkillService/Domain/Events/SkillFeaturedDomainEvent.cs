using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record SkillFeaturedDomainEvent(
    string SkillId,
    string SkillName,
    string UserId,
    string FeaturedByUserId,
    string Reason) : DomainEvent;
