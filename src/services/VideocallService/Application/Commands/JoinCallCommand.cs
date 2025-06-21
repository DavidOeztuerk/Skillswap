using CQRS.Interfaces;

namespace VideocallService.Application.Commands;

public record JoinCallCommand(
    string SessionId,
    string ConnectionId,
    bool CameraEnabled = true,
    bool MicrophoneEnabled = true,
    string? DeviceInfo = null) : ICommand<JoinCallResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record JoinCallResponse(
    string SessionId,
    string RoomId,
    bool Success,
    List<string> OtherParticipants);

