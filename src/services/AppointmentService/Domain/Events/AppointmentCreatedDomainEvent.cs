using CQRS.Interfaces;

namespace AppointmentService.Domain.Events;

public record AppointmentCreatedDomainEvent(
    string AppointmentId,
    string OrganizerUserId,
    string ParticipantUserId,
    string Title,
    DateTime ScheduledDate,
    string? SkillId,
    string? MatchId) : DomainEvent;
