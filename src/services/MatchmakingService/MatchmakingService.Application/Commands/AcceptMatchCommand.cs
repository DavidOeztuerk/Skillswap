using Contracts.Matchmaking.Responses;
using CQRS.Interfaces;

namespace MatchmakingService.Application.Commands;

public record AcceptMatchCommand(
    string MatchId) 
    : ICommand<AcceptMatchResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public string[] InvalidationPatterns => new[]
    {
        "user-matches:*",
        "outgoing-match-requests:*",  // Fix: Matches actual cache keys
        "incoming-match-requests:*",  // Fix: Matches actual cache keys
        "accepted-match-requests:*",
        "match-statistics:*"
    };
}

