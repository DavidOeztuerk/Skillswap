using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record SkillReviewDeletedDomainEvent(
    string ReviewId,
    string SkillId,
    string ReviewerUserId,
    string Reason) : DomainEvent;
