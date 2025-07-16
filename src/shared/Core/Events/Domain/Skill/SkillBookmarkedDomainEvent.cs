using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record SkillBookmarkedDomainEvent(
    string SkillId,
    string SkillOwnerId,
    string BookmarkerUserId) : DomainEvent;
