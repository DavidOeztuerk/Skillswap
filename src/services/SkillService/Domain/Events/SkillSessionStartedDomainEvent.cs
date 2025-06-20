using CQRS.Interfaces;

namespace SkillService.Domain.Events;

public record SkillSessionStartedDomainEvent(
    string SessionId,
    string SkillId,
    string TeacherUserId,
    string LearnerUserId,
    DateTime StartedAt) : DomainEvent;
