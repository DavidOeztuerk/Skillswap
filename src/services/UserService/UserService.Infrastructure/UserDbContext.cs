using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using UserService.Domain.Models;
using System.Text.Json;
using Domain.Abstractions;
using UserService.Domain.Enums;

namespace UserService;

public class UserDbContext(
    DbContextOptions<UserDbContext> options)
    : DbContext(options)
{
    // DbSets
    public DbSet<User> Users => Set<User>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<UserPermission> UserPermissions => Set<UserPermission>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<UserActivity> UserActivities => Set<UserActivity>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();
    public DbSet<BlockedUser> BlockedUsers => Set<BlockedUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureUserEntity(modelBuilder);
        ConfigureUserRoleEntity(modelBuilder);
        ConfigureRoleEntity(modelBuilder);
        ConfigurePermissionEntity(modelBuilder);
        ConfigureRolePermissionEntity(modelBuilder);
        ConfigureUserPermissionEntity(modelBuilder);
        ConfigureRefreshTokenEntity(modelBuilder);
        ConfigureUserActivityEntity(modelBuilder);
        ConfigureUserSessionEntity(modelBuilder);
        ConfigureBlockedUserEntity(modelBuilder);

        // Seed initial data
        SeedInitialData(modelBuilder);
    }

    private static void ConfigureUserEntity(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            // Primary key
            entity.HasKey(e => e.Id);

            // Properties
            entity.Property(e => e.Id)
                .HasMaxLength(450)
                .ValueGeneratedOnAdd();

            entity.Property(e => e.UserName)
                .HasColumnName("Username")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(e => e.Email)
                .HasColumnName("Email")
                .HasMaxLength(256)
                .IsRequired();

            entity.Property(e => e.PhoneNumber)
                .HasColumnName("PhoneNumber")
                .HasMaxLength(20)
                .IsRequired(false);

            // Indexes
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.UserName).IsUnique();
            entity.HasIndex(e => e.AccountStatus);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.LastLoginAt);
            entity.HasIndex(e => e.EmailVerificationToken);
            entity.HasIndex(e => e.PasswordResetToken);
            entity.HasIndex(e => e.EmailVerified);
            entity.HasIndex(e => e.TwoFactorEnabled);
            entity.HasIndex(e => e.IsDeleted);

            entity.Property(e => e.PasswordHash)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.FirstName)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.LastName)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.Bio)
                .HasMaxLength(1000);

            entity.Property(e => e.TimeZone)
                .HasMaxLength(100);

            entity.Property(e => e.AccountStatus)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue(AccountStatus.PendingVerification)
                .HasConversion<string>();


            entity.Property(e => e.EmailVerificationToken)
                .HasMaxLength(100);

            entity.Property(e => e.PasswordResetToken)
                .HasMaxLength(100);

            entity.Property(e => e.LastLoginIp)
                .HasMaxLength(45);

            entity.Property(e => e.ProfilcePictureUrl)
                .HasMaxLength(500);

            entity.Property(e => e.PreferencesJson)
                .HasColumnType("text");

            entity.Property(e => e.AvailabilityJson)
                .HasColumnType("text");

            entity.Property(e => e.BlockedDatesJson)
                .HasColumnType("text");

            entity.Property(e => e.NotificationPreferencesJson)
                .HasColumnType("text");

            // Default values - PostgreSQL specific
            entity.Property(e => e.EmailVerified)
                .HasDefaultValue(false);

            entity.Property(e => e.PhoneVerified)
                .HasDefaultValue(false);

            entity.Property(e => e.TwoFactorEnabled)
                .HasDefaultValue(false);

            entity.Property(e => e.TwoFactorSecret)
                .HasMaxLength(100);

            entity.Property(e => e.FailedLoginAttempts)
                .HasDefaultValue(0);

            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false);

            // PostgreSQL specific default values
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("NOW()"); // PostgreSQL syntax

            // Navigation properties
            entity.HasMany(e => e.UserRoles)
                .WithOne(e => e.User)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.RefreshTokens)
                .WithOne(e => e.User)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.Activities)
                .WithOne(e => e.User)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.Sessions)
                .WithOne(e => e.User)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.BlockedUsers)
                .WithOne(e => e.User)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // RBAC Navigation properties
            entity.HasMany(e => e.UserPermissions)
                .WithOne(e => e.User)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.PermissionsGranted)
                .WithOne(e => e.GrantedByUser)
                .HasForeignKey(e => e.GrantedBy)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasMany(e => e.PermissionsRevoked)
                .WithOne(e => e.RevokedByUser)
                .HasForeignKey(e => e.RevokedBy)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasMany(e => e.RolePermissionsGranted)
                .WithOne(e => e.GrantedByUser)
                .HasForeignKey(e => e.GrantedBy)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasMany(e => e.RolePermissionsRevoked)
                .WithOne(e => e.RevokedByUser)
                .HasForeignKey(e => e.RevokedBy)
                .OnDelete(DeleteBehavior.SetNull);

            // FavoriteSkillIds configuration with Value Comparer
            entity.Property(e => e.FavoriteSkillIds)
            .HasColumnType("text")
            .HasConversion(
                // Value Converter: Wie wird die Liste in die DB gespeichert?
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>()
            )
            .Metadata.SetValueComparer(new ValueComparer<List<string>>(
                // 1. Equals: Wie werden zwei Listen verglichen?
                (c1, c2) => c1 != null && c2 != null && c1.SequenceEqual(c2),

                // 2. GetHashCode: Wie wird der Hash-Code berechnet?
                c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),

                // 3. Snapshot: Wie wird eine Kopie erstellt?
                c => c.ToList()
            ));
        });
    }

    private static void ConfigureBlockedUserEntity(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<BlockedUser>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasMaxLength(450)
                .ValueGeneratedOnAdd();

            entity.Property(e => e.UserId)
                .IsRequired()
                .HasMaxLength(450);

            entity.Property(e => e.Reason)
                .HasMaxLength(1000);

            entity.HasIndex(e => new { e.UserId }).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.BlockedAt);

            entity.Property(e => e.BlockedAt)
                .HasDefaultValueSql("NOW()"); // PostgreSQL syntax

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("NOW()"); // PostgreSQL syntax

            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false);

            entity.HasOne(e => e.User)
                .WithMany(u => u.BlockedUsers)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureUserRoleEntity(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => new { e.UserId, e.Role, e.RevokedAt });
            entity.HasIndex(e => e.AssignedAt);

            entity.Property(e => e.Id)
                .HasMaxLength(450)
                .ValueGeneratedOnAdd();

            entity.Property(e => e.UserId)
                .IsRequired()
                .HasMaxLength(450);

            entity.Property(e => e.Role)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.AssignedBy)
                .HasMaxLength(450);

            entity.Property(e => e.RevokedBy)
                .HasMaxLength(450);

            entity.Property(e => e.AssignedAt)
                .HasDefaultValueSql("NOW()"); // PostgreSQL syntax

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("NOW()"); // PostgreSQL syntax

            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false);
        });
    }

    private static void ConfigureRefreshTokenEntity(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ExpiryDate);
            entity.HasIndex(e => e.IsRevoked);

            entity.Property(e => e.Id)
                .HasMaxLength(450)
                .ValueGeneratedOnAdd();

            entity.Property(e => e.Token)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.UserId)
                .IsRequired()
                .HasMaxLength(450);

            entity.Property(e => e.RevokedReason)
                .HasMaxLength(200);

            entity.Property(e => e.IpAddress)
                .HasMaxLength(45);

            entity.Property(e => e.UserAgent)
                .HasMaxLength(500);

            entity.Property(e => e.IsRevoked)
                .HasDefaultValue(false);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("NOW()"); // PostgreSQL syntax

            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false);
        });
    }

    private static void ConfigureUserActivityEntity(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserActivity>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ActivityType);
            entity.HasIndex(e => e.Timestamp);
            entity.HasIndex(e => new { e.UserId, e.ActivityType, e.Timestamp });

            entity.Property(e => e.Id)
                .HasMaxLength(450)
                .ValueGeneratedOnAdd();

            entity.Property(e => e.UserId)
                .IsRequired()
                .HasMaxLength(450);

            entity.Property(e => e.ActivityType)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.Description)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.IpAddress)
                .HasMaxLength(45);

            entity.Property(e => e.UserAgent)
                .HasMaxLength(500);

            entity.Property(e => e.MetadataJson)
                .HasColumnType("text");

            entity.Property(e => e.Timestamp)
                .HasDefaultValueSql("NOW()"); // PostgreSQL syntax

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("NOW()"); // PostgreSQL syntax

            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false);
        });
    }

    private static void ConfigureUserSessionEntity(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserSession>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.SessionToken).IsUnique();
            entity.HasIndex(e => e.StartedAt);
            entity.HasIndex(e => e.LastActivity);
            entity.HasIndex(e => e.IsActive);

            entity.Property(e => e.Id)
                .HasMaxLength(450)
                .ValueGeneratedOnAdd();

            entity.Property(e => e.UserId)
                .IsRequired()
                .HasMaxLength(450);

            entity.Property(e => e.SessionToken)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.IpAddress)
                .HasMaxLength(45);

            entity.Property(e => e.UserAgent)
                .HasMaxLength(500);

            entity.Property(e => e.DeviceType)
                .HasMaxLength(100);

            entity.Property(e => e.StartedAt)
                .HasDefaultValueSql("NOW()"); // PostgreSQL syntax

            entity.Property(e => e.LastActivity)
                .HasDefaultValueSql("NOW()"); // PostgreSQL syntax

            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("NOW()"); // PostgreSQL syntax

            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false);
        });
    }

    private static void ConfigureRoleEntity(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasMaxLength(450)
                .ValueGeneratedOnAdd();

            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.Description)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.Priority)
                .HasDefaultValue(0);

            entity.Property(e => e.IsSystemRole)
                .HasDefaultValue(false);

            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("NOW()");

            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false);

            // Indexes
            entity.HasIndex(e => e.Name).IsUnique();
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.Priority);

            // Self-referencing relationship for role hierarchy
            entity.HasOne(e => e.ParentRole)
                .WithMany(e => e.ChildRoles)
                .HasForeignKey(e => e.ParentRoleId)
                .OnDelete(DeleteBehavior.Restrict);

            // Navigation properties
            entity.HasMany(e => e.UserRoles)
                .WithOne()
                .HasForeignKey("RoleId")
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.RolePermissions)
                .WithOne(e => e.Role)
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigurePermissionEntity(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Permission>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasMaxLength(450)
                .ValueGeneratedOnAdd();

            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.Category)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.Description)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.Resource)
                .HasMaxLength(200)
                .HasDefaultValue("");

            entity.Property(e => e.IsSystemPermission)
                .HasDefaultValue(false);

            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("NOW()");

            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false);

            // Indexes
            entity.HasIndex(e => e.Name).IsUnique();
            entity.HasIndex(e => e.Category);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => new { e.Category, e.Name });

            // Navigation properties
            entity.HasMany(e => e.RolePermissions)
                .WithOne(e => e.Permission)
                .HasForeignKey(e => e.PermissionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.UserPermissions)
                .WithOne(e => e.Permission)
                .HasForeignKey(e => e.PermissionId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureRolePermissionEntity(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<RolePermission>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasMaxLength(450)
                .ValueGeneratedOnAdd();

            entity.Property(e => e.RoleId)
                .IsRequired();

            entity.Property(e => e.PermissionId)
                .IsRequired();

            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);

            entity.Property(e => e.GrantedAt)
                .HasDefaultValueSql("NOW()");

            entity.Property(e => e.Reason)
                .HasMaxLength(500);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("NOW()");

            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false);

            // Indexes
            entity.HasIndex(e => new { e.RoleId, e.PermissionId }).IsUnique();
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.GrantedAt);

            // Navigation properties are configured in Role and Permission entities
        });
    }

    private static void ConfigureUserPermissionEntity(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserPermission>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasMaxLength(450)
                .ValueGeneratedOnAdd();

            entity.Property(e => e.UserId)
                .IsRequired();

            entity.Property(e => e.PermissionId)
                .IsRequired();

            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);

            entity.Property(e => e.IsGranted)
                .HasDefaultValue(true);

            entity.Property(e => e.GrantedAt)
                .HasDefaultValueSql("NOW()");

            entity.Property(e => e.Reason)
                .HasMaxLength(500);

            entity.Property(e => e.ResourceId)
                .HasMaxLength(450);

            entity.Property(e => e.Conditions)
                .HasColumnType("text");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("NOW()");

            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false);

            // Indexes
            entity.HasIndex(e => new { e.UserId, e.PermissionId, e.ResourceId });
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.ExpiresAt);
            entity.HasIndex(e => e.ResourceId);

            // Navigation properties are configured in User entity
        });
    }

    private static void SeedInitialData(ModelBuilder modelBuilder)
    {
        // Define static GUIDs for consistent seeding
        var superAdminRoleId = "550e8400-e29b-41d4-a716-446655440001";
        var adminRoleId = "550e8400-e29b-41d4-a716-446655440002";
        var moderatorRoleId = "550e8400-e29b-41d4-a716-446655440003";
        var userRoleId = "550e8400-e29b-41d4-a716-446655440004";

        var usersViewPermissionId = "660e8400-e29b-41d4-a716-446655440001";
        var usersManagePermissionId = "660e8400-e29b-41d4-a716-446655440002";
        var skillsViewPermissionId = "660e8400-e29b-41d4-a716-446655440003";
        var skillsManagePermissionId = "660e8400-e29b-41d4-a716-446655440004";

        // Seed system roles
        modelBuilder.Entity<Role>().HasData(
            new
            {
                Id = superAdminRoleId,
                Name = "SuperAdmin",
                Description = "Super Administrator with all permissions",
                Priority = 1000,
                IsSystemRole = true,
                IsActive = true,
                IsDeleted = false,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                ParentRoleId = (string?)null
            },
            new
            {
                Id = adminRoleId,
                Name = "Admin",
                Description = "Administrator with administrative permissions",
                Priority = 900,
                IsSystemRole = true,
                IsActive = true,
                ParentRoleId = (string?)null,
                IsDeleted = false,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new
            {
                Id = moderatorRoleId,
                Name = "Moderator",
                Description = "Moderator with content moderation permissions",
                Priority = 500,
                IsSystemRole = true,
                IsActive = true,
                ParentRoleId = (string?)null,
                IsDeleted = false,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new
            {
                Id = userRoleId,
                Name = "User",
                Description = "Standard user with basic permissions",
                Priority = 100,
                IsSystemRole = true,
                IsActive = true,
                ParentRoleId = (string?)null,
                IsDeleted = false,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );

        // Seed basic permissions
        modelBuilder.Entity<Permission>().HasData(
            new
            {
                Id = usersViewPermissionId,
                Name = "users.view",
                Category = "Users",
                Description = "View users",
                Resource = "",
                IsSystemPermission = true,
                IsActive = true,
                IsDeleted = false,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new
            {
                Id = usersManagePermissionId,
                Name = "users.manage",
                Category = "Users",
                Description = "Manage users",
                Resource = "",
                IsSystemPermission = true,
                IsActive = true,
                IsDeleted = false,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new
            {
                Id = skillsViewPermissionId,
                Name = "skills.view",
                Category = "Skills",
                Description = "View skills",
                Resource = "",
                IsSystemPermission = true,
                IsActive = true,
                IsDeleted = false,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new
            {
                Id = skillsManagePermissionId,
                Name = "skills.manage",
                Category = "Skills",
                Description = "Manage skills",
                Resource = "",
                IsSystemPermission = true,
                IsActive = true,
                IsDeleted = false,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );
    }
    // Helper methods for auditing
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateAuditFields();
        return await base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        UpdateAuditFields();
        return base.SaveChanges();
    }

    private void UpdateAuditFields()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.Entity is AuditableEntity &&
                       (e.State == EntityState.Added || e.State == EntityState.Modified));

        foreach (var entry in entries)
        {
            var entity = (AuditableEntity)entry.Entity;
            var now = DateTime.UtcNow;

            if (entry.State == EntityState.Added)
            {
                entity.CreatedAt = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                entity.UpdatedAt = now;
            }
        }
    }
}