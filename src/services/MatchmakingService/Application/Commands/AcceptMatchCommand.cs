using CQRS.Interfaces;

namespace MatchmakingService.Application.Commands;

public record AcceptMatchCommand(
    string MatchId) : ICommand<AcceptMatchResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record AcceptMatchResponse(
    string MatchId,
    string Status,
    DateTime AcceptedAt);
