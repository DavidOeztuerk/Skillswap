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
        "match-requests:*",
        "accepted-match-requests:*"
    };
}

