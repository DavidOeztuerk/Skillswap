using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record SkillSessionCompletedDomainEvent(
    string SessionId,
    string SkillId,
    string TeacherUserId,
    string LearnerUserId,
    DateTime CompletedAt,
    int ActualDurationMinutes,
    bool WasSuccessful) : DomainEvent;
