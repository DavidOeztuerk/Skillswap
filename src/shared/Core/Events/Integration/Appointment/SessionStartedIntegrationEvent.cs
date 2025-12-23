namespace Events.Integration.Appointment;

/// <summary>
/// Integration event published when a SessionAppointment starts
/// Consumed by NotificationService to send real-time notifications
/// </summary>
public record SessionStartedIntegrationEvent(
    string SessionAppointmentId,
    string OrganizerUserId,
    string ParticipantUserId,
    string? OrganizerName,
    string? OrganizerEmail,
    string? ParticipantName,
    string? ParticipantEmail,
    string Title,
    DateTime ScheduledDate,
    string MeetingLink,
    DateTime PublishedAt);
