using CQRS.Interfaces;

namespace Events.Domain.Appointment;

public record AppointmentCreatedDomainEvent(
    string AppointmentId,
    string OrganizerUserId,
    string ParticipantUserId,
    string Title,
    DateTime ScheduledDate,
    string? SkillId,
    string? MatchId) : DomainEvent;
