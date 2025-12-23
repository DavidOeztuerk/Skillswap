namespace Events.Integration.VideoCall;

/// <summary>
/// Integration event published when a video call session is created.
/// Consumed by NotificationService to notify the participant that a call is ready.
/// </summary>
public record CallSessionCreatedIntegrationEvent(
    string SessionId,
    string RoomId,
    string InitiatorUserId,
    string? InitiatorName,
    string? InitiatorEmail,
    string ParticipantUserId,
    string? ParticipantName,
    string? ParticipantEmail,
    string? AppointmentId,
    string? MatchId,
    DateTime CreatedAt,
    DateTime PublishedAt);
