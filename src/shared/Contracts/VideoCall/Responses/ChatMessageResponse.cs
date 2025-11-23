namespace Contracts.VideoCall.Responses;

/// <summary>
/// Response containing chat message details
/// </summary>
public record ChatMessageResponse(
    string Id,
    string SessionId,
    string SenderId,
    string SenderName,
    string Message,
    DateTime SentAt,
    string MessageType,
    string? Metadata);
