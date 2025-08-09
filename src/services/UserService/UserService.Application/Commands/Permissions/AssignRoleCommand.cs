using CQRS.Interfaces;
using CQRS.Models;

namespace UserService.Application.Commands.Permissions;

/// <summary>
/// Command to assign a role to a user
/// </summary>
public record AssignRoleCommand(
    string RoleName,
    string? AssignedBy = null,
    string? Reason = null)
    : ICommand<ApiResponse<bool>>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}