using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record SkillReviewUpdatedDomainEvent(
    string ReviewId,
    string SkillId,
    string ReviewerUserId,
    int OldRating,
    int NewRating,
    double NewAverageRating) : DomainEvent;
