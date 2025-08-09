using CQRS.Interfaces;
using CQRS.Models;

namespace UserService.Application.Commands.Permissions;

/// <summary>
/// Command to grant a permission to a role
/// </summary>
public record GrantPermissionToRoleCommand(
    string RoleId,
    string PermissionName,
    string? GrantedBy = null,
    string? Reason = null)
    : ICommand<ApiResponse<bool>>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}