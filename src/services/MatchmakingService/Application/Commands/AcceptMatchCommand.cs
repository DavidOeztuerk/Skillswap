using Contracts.Matchmaking.Responses;
using CQRS.Interfaces;

namespace MatchmakingService.Application.Commands;

public record AcceptMatchCommand(
    string MatchId) 
    : ICommand<AcceptMatchResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

