using CQRS.Interfaces;
using CQRS.Models;

namespace UserService.Application.Commands.Permissions;

/// <summary>
/// Command to grant a permission to a user
/// </summary>
public record GrantPermissionCommand(
    string PermissionName,
    string? GrantedBy = null,
    DateTime? ExpiresAt = null,
    string? ResourceId = null,
    string? Reason = null)
    : ICommand<bool>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}