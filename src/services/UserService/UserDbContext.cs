using Infrastructure.Models;
using Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using UserService.Domain.Models;

namespace UserService;

public class UserDbContext(
    DbContextOptions<UserDbContext> options) 
    : DbContext(options)
{
    // DbSets
    public DbSet<User> Users => Set<User>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<UserActivity> UserActivities => Set<UserActivity>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();
    public DbSet<BlockedUser> BlockedUsers => Set<BlockedUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureUserEntity(modelBuilder);
        ConfigureUserRoleEntity(modelBuilder);
        ConfigureRefreshTokenEntity(modelBuilder);
        ConfigureUserActivityEntity(modelBuilder);
        ConfigureUserSessionEntity(modelBuilder);
        ConfigureBlockedUserEntity(modelBuilder);
        SeedDefaultData(modelBuilder);
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
                .HasDefaultValue("PendingVerification");

            entity.Property(e => e.EmailVerificationToken)
                .HasMaxLength(100);

            entity.Property(e => e.PasswordResetToken)
                .HasMaxLength(100);

            entity.Property(e => e.LastLoginIp)
                .HasMaxLength(45);

            entity.Property(e => e.AvatarUrl)
                .HasMaxLength(500);

            entity.Property(e => e.PreferencesJson)
                .HasColumnType("text");

            entity.Property(e => e.AvailabilityJson)
                .HasColumnType("text");

            entity.Property(e => e.BlockedDatesJson)
                .HasColumnType("text");

            entity.Property(e => e.NotificationPreferencesJson)
                .HasColumnType("text");

            // Default values
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

            // Computed columns
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

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

            // FavoriteSkillIds as JSON/text column
            entity.Property(e => e.FavoriteSkillIds)
                .HasColumnType("text")
                .HasConversion(
                    v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                    v => System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<string>()
                );
        });
    }

    private static void ConfigureBlockedUserEntity(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<BlockedUser>(entity =>
        {
            // Primary key
            entity.HasKey(e => e.Id);

            // Properties
            entity.Property(e => e.Id)
                .HasMaxLength(450)
                .ValueGeneratedOnAdd();

            entity.Property(e => e.UserId)
                .IsRequired()
                .HasMaxLength(450);

            entity.Property(e => e.Reason)
                .HasMaxLength(1000);

            // Indexes
            entity.HasIndex(e => new { e.UserId }).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.BlockedAt);

            // Default values
            entity.Property(e => e.BlockedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false);

            // Relationships
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
            // Primary key
            entity.HasKey(e => e.Id);

            // Indexes
            entity.HasIndex(e => new { e.UserId, e.Role, e.RevokedAt });
            entity.HasIndex(e => e.AssignedAt);

            // Properties
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

            // Default values
            entity.Property(e => e.AssignedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false);
        });
    }

    private static void ConfigureRefreshTokenEntity(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            // Primary key
            entity.HasKey(e => e.Id);

            // Indexes
            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ExpiryDate);
            entity.HasIndex(e => e.IsRevoked);

            // Properties
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

            // Default values
            entity.Property(e => e.IsRevoked)
                .HasDefaultValue(false);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false);
        });
    }

    private static void ConfigureUserActivityEntity(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserActivity>(entity =>
        {
            // Primary key
            entity.HasKey(e => e.Id);

            // Indexes
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ActivityType);
            entity.HasIndex(e => e.Timestamp);
            entity.HasIndex(e => new { e.UserId, e.ActivityType, e.Timestamp });

            // Properties
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

            // Default values
            entity.Property(e => e.Timestamp)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false);
        });
    }

    private static void ConfigureUserSessionEntity(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserSession>(entity =>
        {
            // Primary key
            entity.HasKey(e => e.Id);

            // Indexes
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.SessionToken).IsUnique();
            entity.HasIndex(e => e.StartedAt);
            entity.HasIndex(e => e.LastActivity);
            entity.HasIndex(e => e.IsActive);

            // Properties
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

            entity.Property(e => e.Location)
                .HasMaxLength(100);

            // Default values
            entity.Property(e => e.StartedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.LastActivity)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false);
        });
    }

    private static void SeedDefaultData(ModelBuilder modelBuilder)
    {
        // Seed default admin user
        var adminUserId = Guid.NewGuid().ToString();
        
        modelBuilder.Entity<User>().HasData(new
        {
            Id = adminUserId,
            Email = "admin@skillswap.com",
            UserName = "admin",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
            FirstName = "System",
            LastName = "Administrator",
            PhoneNumber = "",
            AccountStatus = "Active",
            EmailVerified = true,
            PhoneVerified = false,
            TwoFactorEnabled = false,
            FailedLoginAttempts = 0,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "System",
            FavoriteSkillIds = new List<string>()
        });

        // Seed admin role
        var adminRoleId = Guid.NewGuid().ToString();
        modelBuilder.Entity<UserRole>().HasData(new
        {
            Id = adminRoleId,
            UserId = adminUserId,
            Role = "Admin",
            AssignedBy = "System",
            AssignedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "System",
            IsDeleted = false
        });

        // Seed demo user
        var demoUserId = Guid.NewGuid().ToString();
        modelBuilder.Entity<User>().HasData(new
        {
            Id = demoUserId,
            Email = "demo@skillswap.com",
            UserName = "demo",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Demo123!"),
            FirstName = "Demo",
            LastName = "User",
            PhoneNumber = "",
            AccountStatus = "Active",
            EmailVerified = true,
            PhoneVerified = false,
            TwoFactorEnabled = false,
            FailedLoginAttempts = 0,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "System",
            FavoriteSkillIds = new List<string>()
        });

        // Seed demo user role
        var demoRoleId = Guid.NewGuid().ToString();
        modelBuilder.Entity<UserRole>().HasData(new
        {
            Id = demoRoleId,
            UserId = demoUserId,
            Role = "User",
            AssignedBy = "System",
            AssignedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "System",
            IsDeleted = false
        });
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
                // CreatedBy would be set from the current user context in a real application
            }
            else if (entry.State == EntityState.Modified)
            {
                entity.UpdatedAt = now;
                // UpdatedBy would be set from the current user context in a real application
            }
        }
    }
}
