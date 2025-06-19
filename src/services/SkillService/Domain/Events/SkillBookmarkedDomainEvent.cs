using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record SkillBookmarkedDomainEvent(
    string SkillId,
    string SkillOwnerId,
    string BookmarkerUserId) : DomainEvent;
