namespace Infrastructure.Security;

/// <summary>
/// Maps roles to the permissions they implicitly grant.
/// </summary>
public static class RolePermissions
{
    private static readonly IReadOnlyDictionary<string, string[]> _rolePermissions =
        new Dictionary<string, string[]>
        {
            [Roles.SuperAdmin] =
            [
                Permissions.ReadUsers,
                Permissions.WriteUsers,
                Permissions.DeleteUsers,
                Permissions.ManageUserRoles,
                Permissions.ReadSkills,
                Permissions.WriteSkills,
                Permissions.DeleteSkills,
                Permissions.ManageCategories,
                Permissions.AccessMatching,
                Permissions.ViewAllMatches,
                Permissions.ReadAppointments,
                Permissions.WriteAppointments,
                Permissions.DeleteAppointments,
                Permissions.AccessVideoCalls,
                Permissions.ManageVideoCalls,
                Permissions.AccessAdminPanel,
                Permissions.ViewSystemLogs,
                Permissions.ManageSystem
            ],
            [Roles.Admin] =
            [
                Permissions.ReadUsers,
                Permissions.WriteUsers,
                Permissions.DeleteUsers,
                Permissions.ManageUserRoles,
                Permissions.ReadSkills,
                Permissions.WriteSkills,
                Permissions.DeleteSkills,
                Permissions.ManageCategories,
                Permissions.AccessMatching,
                Permissions.ViewAllMatches,
                Permissions.ReadAppointments,
                Permissions.WriteAppointments,
                Permissions.DeleteAppointments,
                Permissions.AccessVideoCalls,
                Permissions.ManageVideoCalls,
                Permissions.AccessAdminPanel,
                Permissions.ViewSystemLogs
            ],
            [Roles.Moderator] =
            [
                Permissions.ReadUsers,
                Permissions.ReadSkills,
                Permissions.AccessMatching,
                Permissions.ViewAllMatches,
                Permissions.ReadAppointments,
                Permissions.AccessVideoCalls
            ],
            [Roles.User] =
            [
                Permissions.ReadSkills,
                Permissions.AccessMatching,
                Permissions.ReadAppointments,
                Permissions.AccessVideoCalls
            ]
        };

    /// <summary>
    /// Get all permissions granted by the specified roles.
    /// </summary>
    public static IEnumerable<string> GetPermissionsForRoles(IEnumerable<string> roles)
    {
        return roles
            .SelectMany(role => _rolePermissions.TryGetValue(role, out var perms)
                ? perms
                : [])
            .Distinct();
    }
}
