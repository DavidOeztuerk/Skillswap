using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using System.Text.Json;
using Domain.Abstractions;
using UserService.Domain.Enums;
using UserService.Domain.Models;

public class UserDbContext(DbContextOptions<UserDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<UserPermission> UserPermissions => Set<UserPermission>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<UserActivity> UserActivities => Set<UserActivity>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();
    public DbSet<BlockedUser> BlockedUsers => Set<BlockedUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureUser(modelBuilder);
        ConfigureRole(modelBuilder);
        ConfigurePermission(modelBuilder);
        ConfigureUserRole(modelBuilder);
        ConfigureRolePermission(modelBuilder);
        ConfigureUserPermission(modelBuilder);
        ConfigureRefreshToken(modelBuilder);
        ConfigureUserActivity(modelBuilder);
        ConfigureUserSession(modelBuilder);
        ConfigureBlockedUser(modelBuilder);

        Seed(modelBuilder);
    }

    private static void ConfigureUser(ModelBuilder mb)
    {
        var e = mb.Entity<User>();
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).HasMaxLength(450).ValueGeneratedOnAdd();

        e.Property(x => x.UserName).HasMaxLength(100).IsRequired().HasColumnName("Username");
        e.Property(x => x.Email).HasMaxLength(256).IsRequired();
        e.Property(x => x.PasswordHash).HasMaxLength(500).IsRequired();
        e.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
        e.Property(x => x.LastName).HasMaxLength(100).IsRequired();

        e.Property(x => x.Bio).HasMaxLength(1000);
        e.Property(x => x.TimeZone).HasMaxLength(100);
        e.Property(x => x.PhoneNumber).HasMaxLength(20);
        e.Property(x => x.LastLoginIp).HasMaxLength(45);
        e.Property(x => x.ProfilePictureUrl).HasMaxLength(500);

        e.Property(x => x.AccountStatus)
         .HasConversion<string>()
         .HasMaxLength(32)
         .HasDefaultValue(AccountStatus.PendingVerification);

        e.Property(x => x.EmailVerificationToken).HasMaxLength(100);
        e.Property(x => x.PasswordResetToken).HasMaxLength(100);
        e.Property(x => x.TwoFactorSecret).HasMaxLength(100);

        e.Property(x => x.PreferencesJson).HasColumnType("text");
        e.Property(x => x.AvailabilityJson).HasColumnType("text");
        e.Property(x => x.BlockedDatesJson).HasColumnType("text");
        e.Property(x => x.NotificationPreferencesJson).HasColumnType("text");

        // Defaults (Npgsql)
        e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.EmailVerified).HasDefaultValue(false);
        e.Property(x => x.PhoneVerified).HasDefaultValue(false);
        e.Property(x => x.TwoFactorEnabled).HasDefaultValue(false);
        e.Property(x => x.FailedLoginAttempts).HasDefaultValue(0);
        e.Property(x => x.IsDeleted).HasDefaultValue(false);

        // Indizes
        e.HasIndex(x => x.Email).IsUnique();
        e.HasIndex(x => x.UserName).IsUnique();
        e.HasIndex(x => x.AccountStatus);
        e.HasIndex(x => x.CreatedAt);
        e.HasIndex(x => x.LastLoginAt);
        e.HasIndex(x => x.EmailVerificationToken);
        e.HasIndex(x => x.PasswordResetToken);
        e.HasIndex(x => x.EmailVerified);
        e.HasIndex(x => x.TwoFactorEnabled);
        e.HasIndex(x => x.IsDeleted);
        
        // Composite indexes for common queries
        e.HasIndex(x => new { x.IsDeleted, x.AccountStatus, x.CreatedAt })
            .HasDatabaseName("IX_Users_Search");
        e.HasIndex(x => new { x.EmailVerified, x.AccountStatus })
            .HasDatabaseName("IX_Users_VerificationStatus");
        e.HasIndex(x => new { x.FirstName, x.LastName })
            .HasDatabaseName("IX_Users_Name");

        // ValueConverter + ValueComparer für List<string>
        e.Property(x => x.FavoriteSkillIds)
         .HasColumnType("text")
         .HasConversion(
            v => JsonSerializer.Serialize(v ?? new List<string>(), (JsonSerializerOptions?)null),
            v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new())
         .Metadata.SetValueComparer(new ValueComparer<List<string>>(
            (a, b) => a != null && b != null && a.SequenceEqual(b),
            v => v.Aggregate(0, (h, s) => HashCode.Combine(h, s.GetHashCode())),
            v => v == null ? new List<string>() : new List<string>(v)));

        // Navs
        e.HasMany(x => x.UserRoles)
         .WithOne(x => x.User)
         .HasForeignKey(x => x.UserId)
         .OnDelete(DeleteBehavior.Cascade);

        e.HasMany(x => x.UserPermissions)
         .WithOne(x => x.User)
         .HasForeignKey(x => x.UserId)
         .OnDelete(DeleteBehavior.Cascade);

        e.HasMany(x => x.RefreshTokens)
         .WithOne(x => x.User)
         .HasForeignKey(x => x.UserId)
         .OnDelete(DeleteBehavior.Cascade);

        e.HasMany(x => x.Activities)
         .WithOne(x => x.User)
         .HasForeignKey(x => x.UserId)
         .OnDelete(DeleteBehavior.Cascade);

        e.HasMany(x => x.Sessions)
         .WithOne(x => x.User)
         .HasForeignKey(x => x.UserId)
         .OnDelete(DeleteBehavior.Cascade);

        // Block-Relationen
        e.HasMany(x => x.BlockedUsersInitiated)
         .WithOne(x => x.User)
         .HasForeignKey(x => x.UserId)
         .OnDelete(DeleteBehavior.Cascade);

        e.HasMany(x => x.BlockedByOthers)
         .WithOne(x => x.BlockedUserRef)
         .HasForeignKey(x => x.BlockedUserId)
         .OnDelete(DeleteBehavior.Cascade);
    }

    private static void ConfigureRole(ModelBuilder mb)
    {
        var e = mb.Entity<Role>();
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).HasMaxLength(450).ValueGeneratedOnAdd();
        e.Property(x => x.Name).IsRequired().HasMaxLength(100);
        e.Property(x => x.Description).IsRequired().HasMaxLength(500);
        e.Property(x => x.Priority).HasDefaultValue(0);
        e.Property(x => x.IsSystemRole).HasDefaultValue(false);
        e.Property(x => x.IsActive).HasDefaultValue(true);
        e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.IsDeleted).HasDefaultValue(false);

        e.Property(x => x.ParentRoleId).HasMaxLength(450);

        e.HasOne(x => x.ParentRole)
         .WithMany(x => x.ChildRoles)
         .HasForeignKey(x => x.ParentRoleId)
         .OnDelete(DeleteBehavior.Restrict);

        e.HasIndex(x => x.Name).IsUnique();
        e.HasIndex(x => x.IsActive);
        e.HasIndex(x => x.Priority);
    }

    private static void ConfigurePermission(ModelBuilder mb)
    {
        var e = mb.Entity<Permission>();
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).HasMaxLength(450).ValueGeneratedOnAdd();
        e.Property(x => x.Name).IsRequired().HasMaxLength(200);
        e.Property(x => x.Category).IsRequired().HasMaxLength(100);
        e.Property(x => x.Description).IsRequired().HasMaxLength(500);
        e.Property(x => x.Resource).HasMaxLength(200).HasDefaultValue("");
        e.Property(x => x.IsSystemPermission).HasDefaultValue(false);
        e.Property(x => x.IsActive).HasDefaultValue(true);
        e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.IsDeleted).HasDefaultValue(false);

        e.HasMany(p => p.UserPermissions)
            .WithOne(up => up.Permission)
            .HasForeignKey(up => up.PermissionId)
            .OnDelete(DeleteBehavior.Cascade);

        e.HasIndex(x => x.Name).IsUnique();
        e.HasIndex(x => new { x.Category, x.Name });
        e.HasIndex(x => x.IsActive);
    }

    private static void ConfigureUserRole(ModelBuilder mb)
    {
        var e = mb.Entity<UserRole>();
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).HasMaxLength(450).ValueGeneratedOnAdd();
        e.Property(x => x.UserId).IsRequired().HasMaxLength(450);
        e.Property(x => x.RoleId).IsRequired().HasMaxLength(450);
        e.Property(x => x.AssignedBy).HasMaxLength(450);
        e.Property(x => x.RevokedBy).HasMaxLength(450);
        e.Property(x => x.AssignedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.IsDeleted).HasDefaultValue(false);

        e.HasIndex(x => new { x.UserId, x.RoleId, x.RevokedAt });

        e.HasOne(x => x.User)
         .WithMany(u => u.UserRoles)
         .HasForeignKey(x => x.UserId)
         .OnDelete(DeleteBehavior.Cascade);
    }

    private static void ConfigureRolePermission(ModelBuilder mb)
    {
        var e = mb.Entity<RolePermission>();
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).HasMaxLength(450).ValueGeneratedOnAdd();
        e.Property(x => x.RoleId).IsRequired().HasMaxLength(450);
        e.Property(x => x.PermissionId).IsRequired().HasMaxLength(450);
        e.Property(x => x.IsActive).HasDefaultValue(true);
        e.Property(x => x.GrantedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.Reason).HasMaxLength(500);
        e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.IsDeleted).HasDefaultValue(false);

        e.HasIndex(x => new { x.RoleId, x.PermissionId }).IsUnique();
        e.HasIndex(x => x.IsActive);
        e.HasIndex(x => x.GrantedAt);

        e.HasOne(rp => rp.Role)
            .WithMany(r => r.RolePermissions)
            .HasForeignKey(rp => rp.RoleId)
            .OnDelete(DeleteBehavior.Cascade);

        e.HasOne(rp => rp.Permission)
            .WithMany(p => p.RolePermissions)
            .HasForeignKey(rp => rp.PermissionId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    private static void ConfigureUserPermission(ModelBuilder mb)
    {
        var e = mb.Entity<UserPermission>();
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).HasMaxLength(450).ValueGeneratedOnAdd();
        e.Property(x => x.UserId).IsRequired().HasMaxLength(450);
        e.Property(x => x.PermissionId).IsRequired().HasMaxLength(450);
        e.Property(x => x.IsActive).HasDefaultValue(true);
        e.Property(x => x.IsGranted).HasDefaultValue(true);
        e.Property(x => x.GrantedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.GrantedBy).HasMaxLength(450);  // Nur String ID
        e.Property(x => x.RevokedBy).HasMaxLength(450);  // Nur String ID
        e.Property(x => x.Reason).HasMaxLength(500);
        e.Property(x => x.ResourceId).HasMaxLength(450);
        e.Property(x => x.Conditions).HasColumnType("text");
        e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.IsDeleted).HasDefaultValue(false);

        // NUR die wichtigen Beziehungen
        e.HasOne(up => up.User)
            .WithMany(u => u.UserPermissions)
            .HasForeignKey(up => up.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        e.HasOne(up => up.Permission)
            .WithMany(p => p.UserPermissions)
            .HasForeignKey(up => up.PermissionId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indizes
        e.HasIndex(up => new { up.UserId, up.PermissionId, up.ResourceId });
        e.HasIndex(up => up.IsActive);
        e.HasIndex(up => up.IsGranted);
        e.HasIndex(up => up.ExpiresAt);
    }

    private static void ConfigureRefreshToken(ModelBuilder mb)
    {
        var e = mb.Entity<RefreshToken>();
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).HasMaxLength(450).ValueGeneratedOnAdd();
        e.Property(x => x.Token).IsRequired().HasMaxLength(500);
        e.Property(x => x.UserId).IsRequired().HasMaxLength(450);
        e.Property(x => x.RevokedReason).HasMaxLength(200);
        e.Property(x => x.IpAddress).HasMaxLength(45);
        e.Property(x => x.UserAgent).HasMaxLength(500);
        e.Property(x => x.IsRevoked).HasDefaultValue(false);
        e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.IsDeleted).HasDefaultValue(false);

        e.HasIndex(x => x.Token).IsUnique();
        e.HasIndex(x => x.UserId);
        e.HasIndex(x => x.ExpiryDate);
        e.HasIndex(x => x.IsRevoked);

        e.HasOne(x => x.User)
         .WithMany(u => u.RefreshTokens)
         .HasForeignKey(x => x.UserId)
         .OnDelete(DeleteBehavior.Cascade);
    }

    private static void ConfigureUserActivity(ModelBuilder mb)
    {
        var e = mb.Entity<UserActivity>();
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).HasMaxLength(450).ValueGeneratedOnAdd();
        e.Property(x => x.UserId).IsRequired().HasMaxLength(450);
        e.Property(x => x.ActivityType).IsRequired().HasMaxLength(100);
        e.Property(x => x.Description).IsRequired().HasMaxLength(500);
        e.Property(x => x.IpAddress).HasMaxLength(45);
        e.Property(x => x.UserAgent).HasMaxLength(500);
        e.Property(x => x.MetadataJson).HasColumnType("text");
        e.Property(x => x.Timestamp).HasDefaultValueSql("NOW()");
        e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.IsDeleted).HasDefaultValue(false);

        e.HasIndex(x => x.UserId);
        e.HasIndex(x => x.ActivityType);
        e.HasIndex(x => x.Timestamp);
        e.HasIndex(x => new { x.UserId, x.ActivityType, x.Timestamp });

        e.HasOne(x => x.User)
         .WithMany(u => u.Activities)
         .HasForeignKey(x => x.UserId)
         .OnDelete(DeleteBehavior.Cascade);
    }

    private static void ConfigureUserSession(ModelBuilder mb)
    {
        var e = mb.Entity<UserSession>();
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).HasMaxLength(450).ValueGeneratedOnAdd();
        e.Property(x => x.UserId).IsRequired().HasMaxLength(450);
        e.Property(x => x.SessionToken).IsRequired().HasMaxLength(500);
        e.Property(x => x.IpAddress).HasMaxLength(45);
        e.Property(x => x.UserAgent).HasMaxLength(500);
        e.Property(x => x.DeviceType).HasMaxLength(100);
        e.Property(x => x.StartedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.LastActivity).HasDefaultValueSql("NOW()");
        e.Property(x => x.IsActive).HasDefaultValue(true);
        e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.IsDeleted).HasDefaultValue(false);

        e.HasIndex(x => x.UserId);
        e.HasIndex(x => x.SessionToken).IsUnique();
        e.HasIndex(x => x.StartedAt);
        e.HasIndex(x => x.LastActivity);
        e.HasIndex(x => x.IsActive);

        e.HasOne(x => x.User)
         .WithMany(u => u.Sessions)
         .HasForeignKey(x => x.UserId)
         .OnDelete(DeleteBehavior.Cascade);
    }

    private static void ConfigureBlockedUser(ModelBuilder mb)
    {
        var e = mb.Entity<BlockedUser>();
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).HasMaxLength(450).ValueGeneratedOnAdd();
        e.Property(x => x.UserId).IsRequired().HasMaxLength(450);
        e.Property(x => x.BlockedUserId).IsRequired().HasMaxLength(450);
        e.Property(x => x.Reason).HasMaxLength(1000);
        e.Property(x => x.BlockedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.IsDeleted).HasDefaultValue(false);

        // Ein Block pro Paar
        e.HasIndex(x => new { x.UserId, x.BlockedUserId }).IsUnique();

        // Selbst-Referenzen
        e.HasOne(x => x.User)
         .WithMany(u => u.BlockedUsersInitiated)
         .HasForeignKey(x => x.UserId)
         .OnDelete(DeleteBehavior.Cascade);

        e.HasOne(x => x.BlockedUserRef)
         .WithMany(u => u.BlockedByOthers)
         .HasForeignKey(x => x.BlockedUserId)
         .OnDelete(DeleteBehavior.Cascade);
    }

    private static void Seed(ModelBuilder mb)
    {
        // Beispiel-Seed (IDs stabil halten!)
        var superAdminRoleId = "550e8400-e29b-41d4-a716-446655440001";
        var adminRoleId = "550e8400-e29b-41d4-a716-446655440002";
        var moderatorRoleId = "550e8400-e29b-41d4-a716-446655440003";
        var userRoleId = "550e8400-e29b-41d4-a716-446655440004";

        var usersViewPermissionId = "660e8400-e29b-41d4-a716-446655440001";
        var usersManagePermissionId = "660e8400-e29b-41d4-a716-446655440002";
        var skillsViewPermissionId = "660e8400-e29b-41d4-a716-446655440003";
        var skillsManagePermissionId = "660e8400-e29b-41d4-a716-446655440004";

        mb.Entity<Role>().HasData(
            new { Id = superAdminRoleId, Name = "SuperAdmin", Description = "Super Administrator with all permissions", Priority = 1000, IsSystemRole = true, IsActive = true, IsDeleted = false, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), ParentRoleId = (string?)null },
            new { Id = adminRoleId, Name = "Admin", Description = "Administrator with administrative permissions", Priority = 900, IsSystemRole = true, IsActive = true, IsDeleted = false, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), ParentRoleId = (string?)null },
            new { Id = moderatorRoleId, Name = "Moderator", Description = "Moderator with content moderation permissions", Priority = 500, IsSystemRole = true, IsActive = true, IsDeleted = false, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), ParentRoleId = (string?)null },
            new { Id = userRoleId, Name = "User", Description = "Standard user with basic permissions", Priority = 100, IsSystemRole = true, IsActive = true, IsDeleted = false, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), ParentRoleId = (string?)null }
        );

        mb.Entity<Permission>().HasData(
            new { Id = usersViewPermissionId, Name = "users.view", Category = "Users", Description = "View users", Resource = "", IsSystemPermission = true, IsActive = true, IsDeleted = false, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { Id = usersManagePermissionId, Name = "users.manage", Category = "Users", Description = "Manage users", Resource = "", IsSystemPermission = true, IsActive = true, IsDeleted = false, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { Id = skillsViewPermissionId, Name = "skills.view", Category = "Skills", Description = "View skills", Resource = "", IsSystemPermission = true, IsActive = true, IsDeleted = false, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new { Id = skillsManagePermissionId, Name = "skills.manage", Category = "Skills", Description = "Manage skills", Resource = "", IsSystemPermission = true, IsActive = true, IsDeleted = false, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );
    }

    public override int SaveChanges()
    {
        UpdateAuditFields();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateAuditFields();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateAuditFields()
    {
        var now = DateTime.UtcNow;
        foreach (var e in ChangeTracker.Entries()
                     .Where(e => e.Entity is AuditableEntity &&
                                (e.State == EntityState.Added || e.State == EntityState.Modified)))
        {
            var ent = (AuditableEntity)e.Entity;
            if (e.State == EntityState.Added) ent.CreatedAt = now;
            else ent.UpdatedAt = now;
        }
    }
}
