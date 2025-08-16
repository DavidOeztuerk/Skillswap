using CQRS.Interfaces;

namespace MatchmakingService.Application.Commands;

public record DissolveMatchCommand(
    string MatchId,
    string Reason) : ICommand<DissolveMatchResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record DissolveMatchResponse(
    string MatchId,
    string Status,
    DateTime DissolvedAt);