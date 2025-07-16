using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record SkillEndorsedDomainEvent(
    string SkillId,
    string SkillOwnerId,
    string EndorserUserId,
    string? Message,
    int TotalEndorsements) : DomainEvent;
