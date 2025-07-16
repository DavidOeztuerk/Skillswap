using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record SkillMilestoneReachedDomainEvent(
    string SkillId,
    string UserId,
    string MilestoneType,
    int MilestoneValue,
    DateTime ReachedAt) : DomainEvent; // e.g., "100_sessions", "50_endorsements"
