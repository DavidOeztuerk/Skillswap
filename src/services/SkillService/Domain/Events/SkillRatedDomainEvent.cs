using CQRS.Interfaces;

namespace SkillService.Domain.Events;

// ============================================================================
// SKILL RATING AND REVIEW EVENTS
// ============================================================================

public record SkillRatedDomainEvent(
    string SkillId,
    string SkillOwnerId,
    string ReviewerUserId,
    int Rating,
    double NewAverageRating,
    int TotalReviews) : DomainEvent;
