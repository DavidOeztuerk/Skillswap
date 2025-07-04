using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record SkillReviewUpdatedDomainEvent(
    string ReviewId,
    string SkillId,
    string ReviewerUserId,
    int OldRating,
    int NewRating,
    double NewAverageRating) : DomainEvent;
