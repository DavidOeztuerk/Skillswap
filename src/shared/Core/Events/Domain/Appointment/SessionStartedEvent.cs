using CQRS.Interfaces;

namespace Events.Domain.Appointment;

/// <summary>
/// Domain event published when a SessionAppointment starts
/// </summary>
public record SessionStartedEvent(
    string SessionAppointmentId,
    string SessionSeriesId,
    string ConnectionId,
    string OrganizerUserId,
    string ParticipantUserId,
    DateTime ScheduledDate,
    DateTime StartedAt,
    string MeetingLink) : DomainEvent;
