namespace Contracts.UserService.Permissions;

public class RevokePermissionFromRoleRequest
{
    public Guid RoleId { get; set; }
    public string PermissionName { get; set; } = string.Empty;
    public string? Reason { get; set; }
}