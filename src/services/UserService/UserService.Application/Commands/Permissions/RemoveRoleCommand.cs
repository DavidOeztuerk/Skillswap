using CQRS.Interfaces;
using CQRS.Models;

namespace UserService.Application.Commands.Permissions;

/// <summary>
/// Command to remove a role from a user
/// </summary>
public record RemoveRoleCommand(
    string RoleName,
    string? RemovedBy = null,
    string? Reason = null)
    : ICommand<bool>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}