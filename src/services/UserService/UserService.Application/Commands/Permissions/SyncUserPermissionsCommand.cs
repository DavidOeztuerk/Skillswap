using CQRS.Interfaces;
using CQRS.Models;

namespace UserService.Application.Commands.Permissions;

/// <summary>
/// Command to sync user permissions
/// </summary>
public record SyncUserPermissionsCommand(
    List<string> PermissionNames)
    : ICommand<bool>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}