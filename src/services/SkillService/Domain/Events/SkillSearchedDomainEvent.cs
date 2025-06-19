using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record SkillSearchedDomainEvent(
    string SearchQuery,
    string? CategoryId,
    string? UserId,
    int ResultCount,
    List<string> ResultSkillIds) : DomainEvent;
