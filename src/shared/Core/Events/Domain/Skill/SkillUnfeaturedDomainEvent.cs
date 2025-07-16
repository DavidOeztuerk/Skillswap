using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record SkillUnfeaturedDomainEvent(
    string SkillId,
    string SkillName,
    string UnfeaturedByUserId,
    string Reason) : DomainEvent;
