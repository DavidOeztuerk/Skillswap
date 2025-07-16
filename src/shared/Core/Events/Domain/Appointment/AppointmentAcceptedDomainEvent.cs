using CQRS.Interfaces;

namespace Events.Domain.Appointment;

public record AppointmentAcceptedDomainEvent(
    string AppointmentId,
    string OrganizerUserId,
    string ParticipantUserId,
    DateTime ScheduledDate) : DomainEvent;
