using CQRS.Interfaces;

namespace MatchmakingService.Application.Commands;

public record AcceptMatchRequestCommand(
    string? ResponseMessage = null)
    : ICommand<AcceptDirectMatchRequestResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public string RequestId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record AcceptDirectMatchRequestResponse(
    string MatchId,
    string Status,
    DateTime AcceptedAt);
