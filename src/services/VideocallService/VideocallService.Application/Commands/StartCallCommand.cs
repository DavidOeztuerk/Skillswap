using CQRS.Interfaces;

namespace VideocallService.Application.Commands;

public record StartCallCommand(
    string SessionId) : ICommand<StartCallResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record StartCallResponse(
    string SessionId,
    string Status,
    DateTime StartedAt);
