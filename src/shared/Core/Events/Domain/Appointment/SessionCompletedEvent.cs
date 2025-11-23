using CQRS.Interfaces;

namespace Events.Domain.Appointment;

/// <summary>
/// Domain event published when a SessionAppointment is completed
/// </summary>
public record SessionCompletedEvent(
    string SessionAppointmentId,
    string SessionSeriesId,
    string ConnectionId,
    string OrganizerUserId,
    string ParticipantUserId,
    int DurationMinutes) : DomainEvent;
