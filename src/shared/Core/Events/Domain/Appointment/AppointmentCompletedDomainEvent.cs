using CQRS.Interfaces;

namespace Events.Domain.Appointment;

public record AppointmentCompletedDomainEvent(
    string AppointmentId,
    string OrganizerUserId,
    string ParticipantUserId,
    DateTime CompletedAt,
    int ActualDurationMinutes) : DomainEvent;
