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
        // Seed Permissions
        await SeedPermissionsAsync(context);

        // Seed Roles
        await SeedRolesAsync(context);

        // Seed Role-Permission mappings
        await SeedRolePermissionsAsync(context);

        // Seed Super Admin user if not exists
        await SeedSuperAdminAsync(context);

        await context.SaveChangesAsync();
    }

    private static async Task SeedPermissionsAsync(UserDbContext context)
    {
        var permissions = new List<(string Id, string Name, string Category, string Description)>
        {
            // System Permissions
            (Guid.NewGuid().ToString(), Permissions.SystemManageAll, "System", "Full system management access"),
            (Guid.NewGuid().ToString(), Permissions.SystemViewLogs, "System", "View system logs"),
            (Guid.NewGuid().ToString(), Permissions.SystemManageSettings, "System", "Manage system settings"),
            (Guid.NewGuid().ToString(), Permissions.SystemManageIntegrations, "System", "Manage system integrations"),
            
            // User Management
            (Guid.NewGuid().ToString(), Permissions.UsersCreate, "Users", "Create new users"),
            (Guid.NewGuid().ToString(), Permissions.UsersRead, "Users", "Read user information"),
            (Guid.NewGuid().ToString(), Permissions.UsersReadOwn, "Users", "Read own user information"),
            (Guid.NewGuid().ToString(), Permissions.UsersUpdate, "Users", "Update user information"),
            (Guid.NewGuid().ToString(), Permissions.UsersUpdateOwn, "Users", "Update own user information"),
            (Guid.NewGuid().ToString(), Permissions.UsersDelete, "Users", "Delete users"),
            (Guid.NewGuid().ToString(), Permissions.UsersViewAll, "Users", "View all users"),
            (Guid.NewGuid().ToString(), Permissions.UsersViewReported, "Users", "View reported users"),
            (Guid.NewGuid().ToString(), Permissions.UsersBlock, "Users", "Block users"),
            (Guid.NewGuid().ToString(), Permissions.UsersUnblock, "Users", "Unblock users"),
            (Guid.NewGuid().ToString(), Permissions.UsersManageRoles, "Users", "Manage user roles"),
            
            // Profile Management
            (Guid.NewGuid().ToString(), Permissions.ProfileViewOwn, "Profile", "View own profile"),
            (Guid.NewGuid().ToString(), Permissions.ProfileUpdateOwn, "Profile", "Update own profile"),
            (Guid.NewGuid().ToString(), Permissions.ProfileViewAny, "Profile", "View any profile"),
            
            // Skill Management
            (Guid.NewGuid().ToString(), Permissions.SkillsCreateOwn, "Skills", "Create own skills"),
            (Guid.NewGuid().ToString(), Permissions.SkillsUpdateOwn, "Skills", "Update own skills"),
            (Guid.NewGuid().ToString(), Permissions.SkillsDeleteOwn, "Skills", "Delete own skills"),
            (Guid.NewGuid().ToString(), Permissions.SkillsVerify, "Skills", "Verify skills"),
            (Guid.NewGuid().ToString(), Permissions.SkillsManageCategories, "Skills", "Manage skill categories"),
            (Guid.NewGuid().ToString(), Permissions.SkillsManageProficiency, "Skills", "Manage proficiency levels"),
            (Guid.NewGuid().ToString(), Permissions.SkillsViewAll, "Skills", "View all skills"),
            
            // Appointments
            (Guid.NewGuid().ToString(), Permissions.AppointmentsCreate, "Appointments", "Create appointments"),
            (Guid.NewGuid().ToString(), Permissions.AppointmentsViewOwn, "Appointments", "View own appointments"),
            (Guid.NewGuid().ToString(), Permissions.AppointmentsCancelOwn, "Appointments", "Cancel own appointments"),
            (Guid.NewGuid().ToString(), Permissions.AppointmentsViewAll, "Appointments", "View all appointments"),
            (Guid.NewGuid().ToString(), Permissions.AppointmentsCancelAny, "Appointments", "Cancel any appointment"),
            (Guid.NewGuid().ToString(), Permissions.AppointmentsManage, "Appointments", "Manage all appointments"),
            
            // Matching
            (Guid.NewGuid().ToString(), Permissions.MatchingAccess, "Matching", "Access matching features"),
            (Guid.NewGuid().ToString(), Permissions.MatchingViewAll, "Matching", "View all matches"),
            (Guid.NewGuid().ToString(), Permissions.MatchingManage, "Matching", "Manage matching system"),
            
            // Reviews
            (Guid.NewGuid().ToString(), Permissions.ReviewsCreate, "Reviews", "Create reviews"),
            (Guid.NewGuid().ToString(), Permissions.ReviewsModerate, "Reviews", "Moderate reviews"),
            (Guid.NewGuid().ToString(), Permissions.ReviewsDelete, "Reviews", "Delete reviews"),
            
            // Messages
            (Guid.NewGuid().ToString(), Permissions.MessagesSend, "Messages", "Send messages"),
            (Guid.NewGuid().ToString(), Permissions.MessagesViewOwn, "Messages", "View own messages"),
            (Guid.NewGuid().ToString(), Permissions.MessagesViewAll, "Messages", "View all messages"),
            
            // Video Calls
            (Guid.NewGuid().ToString(), Permissions.VideoCallsAccess, "VideoCall", "Access video calls"),
            (Guid.NewGuid().ToString(), Permissions.VideoCallsManage, "VideoCall", "Manage video calls"),
            
            // Content Moderation
            (Guid.NewGuid().ToString(), Permissions.ContentModerate, "Moderation", "Moderate content"),
            (Guid.NewGuid().ToString(), Permissions.ReportsHandle, "Moderation", "Handle reports"),
            (Guid.NewGuid().ToString(), Permissions.ReportsViewAll, "Moderation", "View all reports"),
            
            // Admin Panel
            (Guid.NewGuid().ToString(), Permissions.AdminAccessDashboard, "Admin", "Access admin dashboard"),
            (Guid.NewGuid().ToString(), Permissions.AdminViewStatistics, "Admin", "View platform statistics"),
            (Guid.NewGuid().ToString(), Permissions.AdminManageAll, "Admin", "Full admin management"),
            
            // Moderator Panel
            (Guid.NewGuid().ToString(), Permissions.ModeratorAccessPanel, "Moderator", "Access moderator panel"),
            
            // Role Management
            (Guid.NewGuid().ToString(), Permissions.RolesCreate, "Roles", "Create roles"),
            (Guid.NewGuid().ToString(), Permissions.RolesUpdate, "Roles", "Update roles"),
            (Guid.NewGuid().ToString(), Permissions.RolesDelete, "Roles", "Delete roles"),
            (Guid.NewGuid().ToString(), Permissions.RolesView, "Roles", "View roles"),
            (Guid.NewGuid().ToString(), Permissions.PermissionsManage, "Roles", "Manage permissions")
        };

        foreach (var (id, name, category, description) in permissions)
        {
            var exists = await context.Permissions
                .AnyAsync(p => p.Name == name);

            if (!exists)
            {
                context.Permissions.Add(Permission.Create(
                    name,
                    category,
                    description,
                    "", // resource
                    category == "System" || category == "Roles" // isSystemPermission
                ));
            }
        }
    }

    private static async Task SeedRolesAsync(UserDbContext context)
    {
        var roles = new List<(string Id, string Name, string Description, int Priority, string? ParentRoleId)>
        {
            (Guid.NewGuid().ToString(), Roles.SuperAdmin, "System administrator with full access", 1000, null),
            (Guid.NewGuid().ToString(), Roles.Admin, "Platform administrator", 100, null),
            (Guid.NewGuid().ToString(), Roles.Moderator, "Content moderator", 50, null),
            (Guid.NewGuid().ToString(), Roles.User, "Regular platform user", 10, null)
        };

        foreach (var (id, name, description, priority, parentRoleId) in roles)
        {
            var exists = await context.Roles
                .AnyAsync(r => r.Name == name);

            if (!exists)
            {
                context.Roles.Add(Role.Create(
                    name,
                    description,
                    priority,
                    true, // isSystemRole
                    parentRoleId
                ));
            }
        }
    }

    private static async Task SeedRolePermissionsAsync(UserDbContext context)
    {
        await context.SaveChangesAsync(); // Save roles and permissions first

        var rolePermissionMappings = new Dictionary<string, string[]>
        {
            [Roles.SuperAdmin] = RolePermissions.GetPermissionsForRoles([Roles.SuperAdmin]).ToArray(),
            [Roles.Admin] = RolePermissions.GetPermissionsForRoles([Roles.Admin]).ToArray(),
            [Roles.Moderator] = RolePermissions.GetPermissionsForRoles([Roles.Moderator]).ToArray(),
            [Roles.User] = RolePermissions.GetPermissionsForRoles([Roles.User]).ToArray()
        };

        foreach (var (roleName, permissionNames) in rolePermissionMappings)
        {
            var role = await context.Roles
                .FirstOrDefaultAsync(r => r.Name == roleName);

            if (role == null) continue;

            foreach (var permissionName in permissionNames)
            {
                var permission = await context.Permissions
                    .FirstOrDefaultAsync(p => p.Name == permissionName);

                if (permission == null) continue;

                var exists = await context.RolePermissions
                    .AnyAsync(rp => rp.RoleId == role.Id && rp.PermissionId == permission.Id);

                if (!exists)
                {
                    context.RolePermissions.Add(RolePermission.Create(
                        role.Id,
                        permission.Id,
                        null,
                        "Initial role permission"
                    ));
                }
            }
        }
    }

    private static async Task SeedSuperAdminAsync(UserDbContext context)
    {
        const string superAdminEmail = "admin@skillswap.com";

        var superAdminUser = await context.Users
            .FirstOrDefaultAsync(u => u.Email == superAdminEmail);

        if (superAdminUser == null)
        {
            superAdminUser = new User
            {
                Id = Guid.NewGuid().ToString(),
                Email = superAdminEmail,
                UserName = "superadmin",
                FirstName = "Super",
                LastName = "Admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!@#"), // Change this in production!
                EmailVerified = true,
                AccountStatus = Domain.Enums.AccountStatus.Active,
                CreatedAt = DateTime.UtcNow
            };

            context.Users.Add(superAdminUser);
            await context.SaveChangesAsync();
        }

        // Assign SuperAdmin role if not already assigned
        var superAdminRole = await context.Roles
            .FirstOrDefaultAsync(r => r.Name == Roles.SuperAdmin);

        if (superAdminRole != null)
        {
            var userRoleExists = await context.UserRoles
                .AnyAsync(ur => ur.UserId == superAdminUser.Id && ur.Role == Roles.SuperAdmin);

            if (!userRoleExists)
            {
                context.UserRoles.Add(new UserRole
                {
                    Id = Guid.NewGuid().ToString(),
                    UserId = superAdminUser.Id,
                    Role = superAdminRole.Name,
                    AssignedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
            }
        }

        // Assign all permissions directly to SuperAdmin user
        await AssignAllPermissionsToSuperAdmin(context, superAdminUser.Id);
    }

    private static async Task AssignAllPermissionsToSuperAdmin(UserDbContext context, string superAdminUserId)
    {
        var allPermissions = await context.Permissions.ToListAsync();

        foreach (var permission in allPermissions)
        {
            var existingUserPermission = await context.UserPermissions
                .AnyAsync(up => up.UserId == superAdminUserId &&
                               up.PermissionId == permission.Id &&
                               up.IsActive);

            if (!existingUserPermission)
            {
                var userPermission = UserPermission.Create(
                    userId: superAdminUserId,
                    permissionId: permission.Id,
                    isGranted: true,
                    grantedBy: superAdminUserId,  // ← Verwende die User ID statt "System"
                    expiresAt: null,
                    resourceId: null,
                    conditions: null,
                    reason: "SuperAdmin initial setup"
                );

                context.UserPermissions.Add(userPermission);
            }
        }

        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Apply seed data through Entity Framework migrations
    /// </summary>
    public static void ApplySeedData(ModelBuilder modelBuilder)
    {
        // This method can be called from OnModelCreating to include seed data in migrations
        // However, for complex seeding with dependencies, it's better to use SeedAsync
    }
}
