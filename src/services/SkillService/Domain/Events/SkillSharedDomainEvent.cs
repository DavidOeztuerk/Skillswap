using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record SkillSharedDomainEvent(
    string SkillId,
    string SkillOwnerId,
    string SharedByUserId,
    string ShareMethod, // "email", "social", "link"
    string? SharedWithEmail) : DomainEvent;
