using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record SkillEndorsedDomainEvent(
    string SkillId,
    string SkillOwnerId,
    string EndorserUserId,
    string? Message,
    int TotalEndorsements) : DomainEvent;
