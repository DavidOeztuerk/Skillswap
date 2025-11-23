using CQRS.Interfaces;

namespace Events.Domain.Appointment;

/// <summary>
/// Domain event published when a new SessionAppointment is scheduled
/// </summary>
public record SessionScheduledEvent(
    string SessionAppointmentId,
    string SessionSeriesId,
    DateTime ScheduledDate,
    string OrganizerUserId,
    string ParticipantUserId) : DomainEvent;
