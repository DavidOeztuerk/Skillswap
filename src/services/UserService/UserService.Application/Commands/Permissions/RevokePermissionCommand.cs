using CQRS.Interfaces;
using CQRS.Models;

namespace UserService.Application.Commands.Permissions;

/// <summary>
/// Command to revoke a permission from a user
/// </summary>
public record RevokePermissionCommand(
    string PermissionName,
    string? RevokedBy = null,
    string? Reason = null)
    : ICommand<bool>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}