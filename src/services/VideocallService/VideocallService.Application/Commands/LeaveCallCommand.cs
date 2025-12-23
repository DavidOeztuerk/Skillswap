using CQRS.Interfaces;

namespace VideocallService.Application.Commands;

public record LeaveCallCommand(
    string SessionId,
    string? Reason = null) : ICommand<LeaveCallResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record LeaveCallResponse(
    string SessionId,
    bool Success,
    DateTime LeftAt);
