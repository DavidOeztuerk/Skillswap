using CQRS.Interfaces;

namespace VideocallService.Application.Commands;

/// <summary>
/// Command to send a chat message in a video call session
/// </summary>
public record SendChatMessageCommand(
    string SessionId,
    string SenderId,
    string SenderName,
    string Message,
    string MessageType = "Text",
    string? Metadata = null) : ICommand<bool>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
