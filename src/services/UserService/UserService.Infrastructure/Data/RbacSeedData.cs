using Microsoft.EntityFrameworkCore;
using UserService.Domain.Models;
using Infrastructure.Security;

namespace UserService.Infrastructure.Data;

/// <summary>
/// Seeds initial RBAC data including roles and permissions
/// </summary>
public static class RbacSeedData
{
    public static async Task SeedAsync(UserDbContext context)
    {
        // No manual transaction here - will be wrapped by ExecutionStrategy in Program.cs
        
        // ✅ 1. Zuerst Permissions (keine Abhängigkeiten)
        await SeedPermissionsAsync(context);
        await context.SaveChangesAsync();

        // ✅ 2. Dann Roles (braucht nur Permissions)
        await SeedRolesAsync(context);
        await context.SaveChangesAsync();

        // ✅ 3. Dann RolePermissions (braucht Roles + Permissions)
        await SeedRolePermissionsAsync(context);
        await context.SaveChangesAsync();

        // ✅ 4. Zuletzt SuperAdmin (braucht alles andere)
        await SeedSuperAdminAsync(context);
        await context.SaveChangesAsync();
    }

    private static async Task SeedPermissionsAsync(UserDbContext context)
    {
        var permissions = new List<(string Name, string Category, string Description)>
        {
            // System
            (Permissions.SystemManageAll,        "System", "Full system management access"),
            (Permissions.SystemViewLogs,         "System", "View system logs"),
            (Permissions.SystemManageSettings,   "System", "Manage system settings"),
            (Permissions.SystemManageIntegrations,"System","Manage system integrations"),

            // Users
            (Permissions.UsersCreate,            "Users",  "Create new users"),
            (Permissions.UsersRead,              "Users",  "Read user information"),
            (Permissions.UsersReadOwn,           "Users",  "Read own user information"),
            (Permissions.UsersUpdate,            "Users",  "Update user information"),
            (Permissions.UsersUpdateOwn,         "Users",  "Update own user information"),
            (Permissions.UsersDelete,            "Users",  "Delete users"),
            (Permissions.UsersViewAll,           "Users",  "View all users"),
            (Permissions.UsersViewReported,      "Users",  "View reported users"),
            (Permissions.UsersBlock,             "Users",  "Block users"),
            (Permissions.UsersUnblock,           "Users",  "Unblock users"),
            (Permissions.UsersManageRoles,       "Users",  "Manage user roles"),

            // Profile
            (Permissions.ProfileViewOwn,         "Profile","View own profile"),
            (Permissions.ProfileUpdateOwn,       "Profile","Update own profile"),
            (Permissions.ProfileViewAny,         "Profile","View any profile"),

            // Skills
            (Permissions.SkillsCreateOwn,        "Skills", "Create own skills"),
            (Permissions.SkillsUpdateOwn,        "Skills", "Update own skills"),
            (Permissions.SkillsDeleteOwn,        "Skills", "Delete own skills"),
            (Permissions.SkillsVerify,           "Skills", "Verify skills"),
            (Permissions.SkillsManageCategories, "Skills", "Manage skill categories"),
            (Permissions.SkillsManageProficiency,"Skills", "Manage proficiency levels"),
            (Permissions.SkillsViewAll,          "Skills", "View all skills"),

            // Appointments
            (Permissions.AppointmentsCreate,     "Appointments","Create appointments"),
            (Permissions.AppointmentsViewOwn,    "Appointments","View own appointments"),
            (Permissions.AppointmentsCancelOwn,  "Appointments","Cancel own appointments"),
            (Permissions.AppointmentsViewAll,    "Appointments","View all appointments"),
            (Permissions.AppointmentsCancelAny,  "Appointments","Cancel any appointment"),
            (Permissions.AppointmentsManage,     "Appointments","Manage all appointments"),

            // Matching
            (Permissions.MatchingAccess,         "Matching","Access matching features"),
            (Permissions.MatchingViewAll,        "Matching","View all matches"),
            (Permissions.MatchingManage,         "Matching","Manage matching system"),

            // Reviews
            (Permissions.ReviewsCreate,          "Reviews","Create reviews"),
            (Permissions.ReviewsModerate,        "Reviews","Moderate reviews"),
            (Permissions.ReviewsDelete,          "Reviews","Delete reviews"),

            // Messages
            (Permissions.MessagesSend,           "Messages","Send messages"),
            (Permissions.MessagesViewOwn,        "Messages","View own messages"),
            (Permissions.MessagesViewAll,        "Messages","View all messages"),

            // Video Calls
            (Permissions.VideoCallsAccess,       "VideoCall","Access video calls"),
            (Permissions.VideoCallsManage,       "VideoCall","Manage video calls"),

            // Moderation
            (Permissions.ContentModerate,        "Moderation","Moderate content"),
            (Permissions.ReportsHandle,          "Moderation","Handle reports"),
            (Permissions.ReportsViewAll,         "Moderation","View all reports"),

            // Admin
            (Permissions.AdminAccessDashboard,   "Admin","Access admin dashboard"),
            (Permissions.AdminViewStatistics,    "Admin","View platform statistics"),
            (Permissions.AdminManageAll,         "Admin","Full admin management"),

            // Moderator
            (Permissions.ModeratorAccessPanel,   "Moderator","Access moderator panel"),

            // Roles / RBAC
            (Permissions.RolesCreate,            "Roles","Create roles"),
            (Permissions.RolesUpdate,            "Roles","Update roles"),
            (Permissions.RolesDelete,            "Roles","Delete roles"),
            (Permissions.RolesView,              "Roles","View roles"),
            (Permissions.PermissionsManage,      "Roles","Manage permissions"),
        };

        foreach (var (name, category, description) in permissions)
        {
            var exists = await context.Permissions.AnyAsync(p => p.Name == name);
            if (!exists)
            {
                context.Permissions.Add(Permission.Create(
                    name: name,
                    category: category,
                    description: description,
                    resource: "",
                    isSystemPermission: category is "System" or "Roles"
                ));
            }
        }
    }

    private static async Task SeedRolesAsync(UserDbContext context)
    {
        // Use same priorities as in migration
        var roles = new List<(string Name, string Description, int Priority)>
        {
            (Roles.SuperAdmin, "System administrator with full access", 1000),
            (Roles.Admin,      "Platform administrator",                900),  // Fixed: was 100
            (Roles.Moderator,  "Content moderator",                     500),  // Fixed: was 50
            (Roles.User,       "Regular platform user",                 100)   // Fixed: was 10
        };

        foreach (var (name, description, priority) in roles)
        {
            var role = await context.Roles.FirstOrDefaultAsync(r => r.Name == name);
            if (role is null)
            {
                context.Roles.Add(Role.Create(
                    name: name,
                    description: description,
                    priority: priority,
                    isSystemRole: true,
                    parentRoleId: null
                ));
            }
            else
            {
                // Update existing role if values differ
                bool changed = false;
                if (role.Description != description) { role.Description = description; changed = true; }
                if (role.Priority != priority) { role.Priority = priority; changed = true; }
                if (!role.IsSystemRole) { role.IsSystemRole = true; changed = true; }
                if (changed) context.Roles.Update(role);
            }
        }
    }

    private static async Task SeedRolePermissionsAsync(UserDbContext context)
    {
        // ✅ Sicherstellen, dass alle Daten committed sind
        await context.SaveChangesAsync();

        var rolePermissionMappings = new Dictionary<string, string[]>
        {
            [Roles.SuperAdmin] = RolePermissions.GetPermissionsForRoles([Roles.SuperAdmin]).ToArray(),
            [Roles.Admin] = RolePermissions.GetPermissionsForRoles([Roles.Admin]).ToArray(),
            [Roles.Moderator] = RolePermissions.GetPermissionsForRoles([Roles.Moderator]).ToArray(),
            [Roles.User] = RolePermissions.GetPermissionsForRoles([Roles.User]).ToArray()
        };

        foreach (var (roleName, permissionNames) in rolePermissionMappings)
        {
            var role = await context.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
            if (role is null)
            {
                // ✅ Warnung statt Silent Skip
                Console.WriteLine($"WARNING: Role '{roleName}' not found during seeding");
                continue;
            }

            foreach (var permissionName in permissionNames)
            {
                var permission = await context.Permissions.FirstOrDefaultAsync(p => p.Name == permissionName);
                if (permission is null)
                {
                    // ✅ Warnung statt Silent Skip
                    Console.WriteLine($"WARNING: Permission '{permissionName}' not found during seeding");
                    continue;
                }

                var exists = await context.RolePermissions
                    .AnyAsync(rp => rp.RoleId == role.Id && rp.PermissionId == permission.Id);
                if (!exists)
                {
                    var rolePermission = RolePermission.Create(
                        roleId: role.Id,
                        permissionId: permission.Id,
                        grantedBy: null,
                        reason: "Initial role permission"
                    );

                    // ✅ Validation
                    if (string.IsNullOrEmpty(rolePermission.RoleId) || string.IsNullOrEmpty(rolePermission.PermissionId))
                    {
                        throw new InvalidOperationException($"Invalid RolePermission: RoleId='{rolePermission.RoleId}', PermissionId='{rolePermission.PermissionId}'");
                    }

                    context.RolePermissions.Add(rolePermission);
                }
            }
        }
    }

    private static async Task SeedSuperAdminAsync(UserDbContext context)
    {
        // Get credentials from environment or use fallback
        var superAdminEmail = Environment.GetEnvironmentVariable("SUPERADMIN_EMAIL") ?? "admin@skillswap.com";
        var superAdminPassword = Environment.GetEnvironmentVariable("SUPERADMIN_PASSWORD");
        
        // Only use hardcoded password in development
        if (string.IsNullOrEmpty(superAdminPassword))
        {
            if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
            {
                superAdminPassword = "Admin123!@#"; // Dev only
            }
            else
            {
                throw new InvalidOperationException("SUPERADMIN_PASSWORD must be set for production");
            }
        }

        var superAdminUser = await context.Users.FirstOrDefaultAsync(u => u.Email == superAdminEmail);
        if (superAdminUser is null)
        {
            superAdminUser = new User
            {
                Id = Guid.NewGuid().ToString(),
                Email = superAdminEmail,
                UserName = "superadmin",
                FirstName = "Super",
                LastName = "Admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(superAdminPassword),
                EmailVerified = true,
                AccountStatus = UserService.Domain.Enums.AccountStatus.Active,
                CreatedAt = DateTime.UtcNow,
                
                // ✅ FIX: Add required fields
                PhoneNumber = "+10000000000",
                FavoriteSkillIds = new List<string>()  // Empty list
            };

            context.Users.Add(superAdminUser);
            await context.SaveChangesAsync();
        }

        var superAdminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == Roles.SuperAdmin) ?? throw new InvalidOperationException($"SuperAdmin role '{Roles.SuperAdmin}' not found. Make sure roles are seeded first.");

        var linkExists = await context.UserRoles
            .AnyAsync(ur => ur.UserId == superAdminUser.Id &&
                           ur.RoleId == superAdminRole.Id &&
                           ur.RevokedAt == null);

        if (!linkExists)
        {
            var userRole = new UserRole
            {
                UserId = superAdminUser.Id,
                RoleId = superAdminRole.Id,
                AssignedAt = DateTime.UtcNow,
                AssignedBy = superAdminUser.Id
            };

            if (string.IsNullOrEmpty(userRole.RoleId))
            {
                throw new InvalidOperationException("RoleId cannot be null or empty");
            }

            context.UserRoles.Add(userRole);
            await context.SaveChangesAsync();
        }

        await AssignAllPermissionsToSuperAdmin(context, superAdminUser.Id);
    }

    private static async Task AssignAllPermissionsToSuperAdmin(UserDbContext context, string superAdminUserId)
    {
        var allPermissions = await context.Permissions.Select(p => new { p.Id }).ToListAsync();

        foreach (var p in allPermissions)
        {
            var exists = await context.UserPermissions
                .AnyAsync(up => up.UserId == superAdminUserId &&
                                up.PermissionId == p.Id &&
                                up.IsActive);
            if (!exists)
            {
                var up = UserPermission.Create(
                    userId: superAdminUserId,
                    permissionId: p.Id,
                    isGranted: true,
                    grantedBy: superAdminUserId,
                    expiresAt: null,
                    resourceId: null,
                    conditions: null,
                    reason: "SuperAdmin initial setup"
                );
                context.UserPermissions.Add(up);
            }
        }

        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Optionally call from OnModelCreating to include seed in migrations.
    /// </summary>
    public static void ApplySeedData(ModelBuilder modelBuilder)
    {
        // For complex seeding we keep runtime SeedAsync.
    }
}
