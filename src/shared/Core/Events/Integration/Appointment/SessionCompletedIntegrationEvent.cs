namespace Events.Integration.Appointment;

/// <summary>
/// Integration event published when a SessionAppointment is completed
/// Consumed by NotificationService for follow-up emails and user notifications
/// </summary>
public record SessionCompletedIntegrationEvent(
    string SessionAppointmentId,
    string SessionSeriesId,
    string OrganizerUserId,
    string ParticipantUserId,
    string? OrganizerName,
    string? OrganizerEmail,
    string? ParticipantName,
    string? ParticipantEmail,
    string Title,
    DateTime ScheduledDate,
    DateTime CompletedAt,
    bool IsNoShow,
    string? NoShowReason,
    decimal? PaymentAmount,
    string? Currency,
    DateTime PublishedAt);
