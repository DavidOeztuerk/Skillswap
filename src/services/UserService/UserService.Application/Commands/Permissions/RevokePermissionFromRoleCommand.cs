using CQRS.Interfaces;
using CQRS.Models;

namespace UserService.Application.Commands.Permissions;

/// <summary>
/// Command to revoke a permission from a role
/// </summary>
public record RevokePermissionFromRoleCommand(
    string RoleId,
    string PermissionName,
    string? RevokedBy = null,
    string? Reason = null)
    : ICommand<ApiResponse<bool>>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}