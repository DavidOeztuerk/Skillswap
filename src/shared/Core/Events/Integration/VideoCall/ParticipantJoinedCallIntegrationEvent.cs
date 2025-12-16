namespace Events.Integration.VideoCall;

/// <summary>
/// Integration event published when a participant joins a video call.
/// Consumed by NotificationService for real-time notifications.
/// </summary>
public record ParticipantJoinedCallIntegrationEvent(
    string SessionId,
    string RoomId,
    string UserId,
    string? UserName,
    string? UserEmail,
    bool CameraEnabled,
    bool MicrophoneEnabled,
    DateTime JoinedAt,
    DateTime PublishedAt);
