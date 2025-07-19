using Contracts.Matchmaking.Responses;
using CQRS.Interfaces;

namespace MatchmakingService.Application.Commands;

public record RejectMatchRequestCommand(
    string RequestId,
    string? ResponseMessage = null)
    : ICommand<RejectMatchRequestResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
