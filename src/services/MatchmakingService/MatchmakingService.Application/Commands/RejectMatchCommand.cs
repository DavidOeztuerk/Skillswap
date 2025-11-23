using Contracts.Matchmaking.Responses;
using CQRS.Interfaces;

namespace MatchmakingService.Application.Commands;

public record RejectMatchCommand(
    string MatchId,
    string? Reason = null)
    : ICommand<RejectMatchResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public string[] InvalidationPatterns => new[]
    {
        "user-matches:*",  // Changed from matches:* to user-matches:* for consistency
        "match-statistics:*"  // Statistics include date ranges
    };
}

//public record RejectMatchResponse(
//    string MatchId,
//    bool Success,
//    DateTime RejectedAt);
