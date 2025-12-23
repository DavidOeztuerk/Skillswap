namespace Events.Integration.VideoCall;

/// <summary>
/// Integration event published when a video call session ends.
/// Consumed by NotificationService for session summary notifications
/// and AppointmentService for session tracking.
/// </summary>
public record CallSessionEndedIntegrationEvent(
    string SessionId,
    string RoomId,
    string? AppointmentId,
    string? MatchId,
    string InitiatorUserId,
    string ParticipantUserId,
    int DurationSeconds,
    int ParticipantCount,
    int MessageCount,
    bool ScreenShareUsed,
    DateTime StartedAt,
    DateTime EndedAt,
    DateTime PublishedAt);
