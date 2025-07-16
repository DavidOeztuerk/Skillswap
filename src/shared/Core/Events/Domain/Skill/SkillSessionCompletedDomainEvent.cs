using CQRS.Interfaces;

namespace Events.Domain.Skill;

public record SkillSessionCompletedDomainEvent(
    string SessionId,
    string SkillId,
    string TeacherUserId,
    string LearnerUserId,
    DateTime CompletedAt,
    int ActualDurationMinutes,
    bool WasSuccessful) : DomainEvent;
