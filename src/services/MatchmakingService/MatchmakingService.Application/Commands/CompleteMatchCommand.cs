using Contracts.Matchmaking.Responses;
using CQRS.Interfaces;

namespace MatchmakingService.Application.Commands;

public record CompleteMatchCommand(
    string MatchId,
    int? SessionDurationMinutes = null,
    string? CompletionNotes = null,
    int? Rating = null) : ICommand<CompleteMatchResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public string[] InvalidationPatterns => new[]
    {
        "user-matches:*",
        "match-statistics:*"  // Statistics include date ranges
    };
}

// public record CompleteMatchResponse(
//     string MatchId,
//     string Status,
//     DateTime CompletedAt);
