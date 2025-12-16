namespace Events.Integration.VideoCall;

/// <summary>
/// Integration event published when a participant leaves a video call.
/// </summary>
public record ParticipantLeftCallIntegrationEvent(
    string SessionId,
    string RoomId,
    string UserId,
    string? UserName,
    DateTime LeftAt,
    string? LeaveReason,
    DateTime PublishedAt);
