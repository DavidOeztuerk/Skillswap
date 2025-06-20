using CQRS.Interfaces;

namespace AppointmentService.Domain.Events;

public record AppointmentAcceptedDomainEvent(
    string AppointmentId,
    string OrganizerUserId,
    string ParticipantUserId,
    DateTime ScheduledDate) : DomainEvent;
