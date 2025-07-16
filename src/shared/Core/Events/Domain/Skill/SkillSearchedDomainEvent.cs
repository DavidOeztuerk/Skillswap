using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record SkillSearchedDomainEvent(
    string SearchQuery,
    string? CategoryId,
    string? UserId,
    int ResultCount,
    List<string> ResultSkillIds) : DomainEvent;
