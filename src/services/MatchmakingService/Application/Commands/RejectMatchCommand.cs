using Contracts.Matchmaking.Responses;
using CQRS.Interfaces;

namespace MatchmakingService.Application.Commands;

public record RejectMatchCommand(
    string MatchId,
    string? Reason = null) 
    : ICommand<RejectMatchResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

//public record RejectMatchResponse(
//    string MatchId,
//    bool Success,
//    DateTime RejectedAt);
