using CQRS.Interfaces;

namespace MatchmakingService.Application.Commands;

public record AcceptMatchRequestCommand(
    string RequestId,
    string? ResponseMessage = null)
    : ICommand<AcceptDirectMatchRequestResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record AcceptDirectMatchRequestResponse(
    string MatchId,
    string Status,
    DateTime AcceptedAt);
