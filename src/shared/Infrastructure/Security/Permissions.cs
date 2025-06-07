namespace Infrastructure.Security;

/// <summary>
/// Permissions for fine-grained access control
/// </summary>
public static class Permissions
{
    // User Management
    public const string ReadUsers = "users:read";
    public const string WriteUsers = "users:write";
    public const string DeleteUsers = "users:delete";
    public const string ManageUserRoles = "users:manage_roles";

    // Skill Management
    public const string ReadSkills = "skills:read";
    public const string WriteSkills = "skills:write";
    public const string DeleteSkills = "skills:delete";
    public const string ManageCategories = "skills:manage_categories";

    // Matching
    public const string AccessMatching = "matching:access";
    public const string ViewAllMatches = "matching:view_all";

    // Appointments
    public const string ReadAppointments = "appointments:read";
    public const string WriteAppointments = "appointments:write";
    public const string DeleteAppointments = "appointments:delete";

    // Video Calls
    public const string AccessVideoCalls = "videocalls:access";
    public const string ManageVideoCalls = "videocalls:manage";

    // System
    public const string AccessAdminPanel = "system:admin_panel";
    public const string ViewSystemLogs = "system:logs";
    public const string ManageSystem = "system:manage";
}
