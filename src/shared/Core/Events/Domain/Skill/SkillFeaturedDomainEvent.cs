using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record SkillFeaturedDomainEvent(
    string SkillId,
    string SkillName,
    string UserId,
    string FeaturedByUserId,
    string Reason) : DomainEvent;
