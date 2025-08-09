namespace Contracts.UserService.Permissions;

public class GrantPermissionToRoleRequest
{
    public Guid RoleId { get; set; }
    public string PermissionName { get; set; } = string.Empty;
    public string? Reason { get; set; }
}