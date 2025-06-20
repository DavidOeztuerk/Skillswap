using CQRS.Interfaces;

namespace AppointmentService.Domain.Events;

public record AppointmentCompletedDomainEvent(
    string AppointmentId,
    string OrganizerUserId,
    string ParticipantUserId,
    DateTime CompletedAt,
    int ActualDurationMinutes) : DomainEvent;
