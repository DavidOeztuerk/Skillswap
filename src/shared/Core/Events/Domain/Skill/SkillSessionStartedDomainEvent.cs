using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record SkillSessionStartedDomainEvent(
    string SessionId,
    string SkillId,
    string TeacherUserId,
    string LearnerUserId,
    DateTime StartedAt) : DomainEvent;
