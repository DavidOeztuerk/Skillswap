using CQRS.Interfaces;

namespace MatchmakingService.Application.Commands;

public record RejectMatchRequestCommand(
    string? ResponseMessage = null)
    : ICommand<RejectMatchRequestResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public string RequestId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record RejectMatchRequestResponse(
    string RequestId,
    bool Success,
    DateTime RejectedAt);