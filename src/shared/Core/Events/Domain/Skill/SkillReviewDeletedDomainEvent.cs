using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record SkillReviewDeletedDomainEvent(
    string ReviewId,
    string SkillId,
    string ReviewerUserId,
    string Reason) : DomainEvent;
