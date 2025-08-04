using Contracts.User.Responses;
using CQRS.Interfaces;

namespace UserService.Application.Commands;

public record BlockUserCommand(
    string BlockedUserId,
    string? Reason = null)
    : ICommand<BlockUserResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
