namespace Events.Integration.VideoCall;

/// <summary>
/// Integration event published when a chat message is sent during a video call.
/// Can be consumed for analytics or notification purposes.
/// </summary>
public record ChatMessageSentIntegrationEvent(
    string MessageId,
    string SessionId,
    string RoomId,
    string UserId,
    string? UserName,
    bool IsEncrypted,
    DateTime SentAt,
    DateTime PublishedAt);
