using CQRS.Interfaces;
using Contracts.UserService.Permissions;

namespace UserService.Application.Commands.Permissions;

/// <summary>
/// Command to create a new role
/// </summary>
public record CreateRoleCommand(
    string Name,
    string Description,
    int Priority = 0,
    string? ParentRoleId = null,
    List<string>? InitialPermissions = null)
    : ICommand<RoleDto>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}