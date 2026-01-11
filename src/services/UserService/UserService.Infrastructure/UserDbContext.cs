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
    public DbSet<UserCalendarConnection> UserCalendarConnections => Set<UserCalendarConnection>();
    public DbSet<AppointmentCalendarEvent> AppointmentCalendarEvents => Set<AppointmentCalendarEvent>();

    // Profile extension tables
    public DbSet<UserExperience> UserExperiences => Set<UserExperience>();
    public DbSet<UserEducation> UserEducation => Set<UserEducation>();
    public DbSet<UserReview> UserReviews => Set<UserReview>();

    public DbSet<UserAvailability> UserAvailabilities => Set<UserAvailability>();
    public DbSet<UserBlockedDate> UserBlockedDates => Set<UserBlockedDate>();
    public DbSet<UserPreferenceEntity> UserPreferenceEntities => Set<UserPreferenceEntity>();
    public DbSet<UserNotificationPreference> UserNotificationPreferences => Set<UserNotificationPreference>();

    public DbSet<UserVerification> UserVerifications => Set<UserVerification>();
    public DbSet<UserLoginHistory> UserLoginHistories => Set<UserLoginHistory>();
    public DbSet<UserPasswordReset> UserPasswordResets => Set<UserPasswordReset>();

    public DbSet<UserStatistics> UserStatistics => Set<UserStatistics>();

    public DbSet<UserLinkedInConnection> UserLinkedInConnections => Set<UserLinkedInConnection>();
    public DbSet<UserXingConnection> UserXingConnections => Set<UserXingConnection>();
    public DbSet<UserImportedSkill> UserImportedSkills => Set<UserImportedSkill>();

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
        ConfigureUserCalendarConnection(modelBuilder);
        ConfigureAppointmentCalendarEvent(modelBuilder);
        ConfigureUserExperience(modelBuilder);
        ConfigureUserEducation(modelBuilder);
        ConfigureUserReview(modelBuilder);

        ConfigureUserAvailability(modelBuilder);
        ConfigureUserBlockedDate(modelBuilder);
        ConfigureUserPreferenceEntity(modelBuilder);
        ConfigureUserNotificationPreference(modelBuilder);

        ConfigureUserVerification(modelBuilder);
        ConfigureUserLoginHistory(modelBuilder);
        ConfigureUserPasswordReset(modelBuilder);

        ConfigureUserStatistics(modelBuilder);

        ConfigureUserLinkedInConnection(modelBuilder);
        ConfigureUserXingConnection(modelBuilder);
        ConfigureUserImportedSkill(modelBuilder);

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
        e.Property(x => x.Headline).HasMaxLength(200);
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

        // Profile extension collections
        e.HasMany(x => x.Experiences)
         .WithOne(x => x.User)
         .HasForeignKey(x => x.UserId)
         .OnDelete(DeleteBehavior.Cascade);

        e.HasMany(x => x.Education)
         .WithOne(x => x.User)
         .HasForeignKey(x => x.UserId)
         .OnDelete(DeleteBehavior.Cascade);

        // Reviews - given and received
        e.HasMany(x => x.ReviewsGiven)
         .WithOne(x => x.Reviewer)
         .HasForeignKey(x => x.ReviewerId)
         .OnDelete(DeleteBehavior.Cascade);

        e.HasMany(x => x.ReviewsReceived)
         .WithOne(x => x.Reviewee)
         .HasForeignKey(x => x.RevieweeId)
         .OnDelete(DeleteBehavior.Cascade);

        e.HasMany(x => x.Availabilities)
         .WithOne(x => x.User)
         .HasForeignKey(x => x.UserId)
         .OnDelete(DeleteBehavior.Cascade);

        e.HasMany(x => x.BlockedDates)
         .WithOne(x => x.User)
         .HasForeignKey(x => x.UserId)
         .OnDelete(DeleteBehavior.Cascade);

        e.HasOne(x => x.Preferences)
         .WithOne(x => x.User)
         .HasForeignKey<UserPreferenceEntity>(x => x.UserId)
         .OnDelete(DeleteBehavior.Cascade);

        e.HasOne(x => x.NotificationPreferences)
         .WithOne(x => x.User)
         .HasForeignKey<UserNotificationPreference>(x => x.UserId)
         .OnDelete(DeleteBehavior.Cascade);

        e.HasOne(x => x.Verification)
         .WithOne(x => x.User)
         .HasForeignKey<UserVerification>(x => x.UserId)
         .OnDelete(DeleteBehavior.Cascade);

        e.HasOne(x => x.LoginHistory)
         .WithOne(x => x.User)
         .HasForeignKey<UserLoginHistory>(x => x.UserId)
         .OnDelete(DeleteBehavior.Cascade);

        e.HasOne(x => x.PasswordReset)
         .WithOne(x => x.User)
         .HasForeignKey<UserPasswordReset>(x => x.UserId)
         .OnDelete(DeleteBehavior.Cascade);

        e.HasOne(x => x.Statistics)
         .WithOne(x => x.User)
         .HasForeignKey<UserStatistics>(x => x.UserId)
         .OnDelete(DeleteBehavior.Cascade);
        
        e.HasOne(x => x.LinkedInConnection)
         .WithOne(x => x.User)
         .HasForeignKey<UserLinkedInConnection>(x => x.UserId)
         .OnDelete(DeleteBehavior.Cascade);

        e.HasOne(x => x.XingConnection)
         .WithOne(x => x.User)
         .HasForeignKey<UserXingConnection>(x => x.UserId)
         .OnDelete(DeleteBehavior.Cascade);

        e.HasMany(x => x.ImportedSkills)
         .WithOne(x => x.User)
         .HasForeignKey(x => x.UserId)
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
        e.Property(x => x.TokenFamilyId).HasMaxLength(450);
        e.Property(x => x.ReplacedByToken).HasMaxLength(450);
        e.Property(x => x.SessionId).HasMaxLength(450);
        e.Property(x => x.IsRevoked).HasDefaultValue(false);
        e.Property(x => x.IsUsed).HasDefaultValue(false);
        e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.IsDeleted).HasDefaultValue(false);

        e.HasIndex(x => x.Token).IsUnique();
        e.HasIndex(x => x.UserId);
        e.HasIndex(x => x.ExpiryDate);
        e.HasIndex(x => x.IsRevoked);
        e.HasIndex(x => x.IsUsed);
        e.HasIndex(x => x.TokenFamilyId);
        e.HasIndex(x => x.SessionId);
        e.HasIndex(x => new { x.UserId, x.IsRevoked, x.IsUsed, x.ExpiryDate })
            .HasDatabaseName("IX_RefreshTokens_Valid");

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
        e.Property(x => x.DeviceFingerprint).HasMaxLength(500);
        e.Property(x => x.Browser).HasMaxLength(100);
        e.Property(x => x.OperatingSystem).HasMaxLength(100);
        e.Property(x => x.ScreenResolution).HasMaxLength(50);
        e.Property(x => x.TimeZone).HasMaxLength(50);
        e.Property(x => x.Language).HasMaxLength(100);
        e.Property(x => x.RevokedReason).HasMaxLength(500);
        e.Property(x => x.StartedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.LastActivity).HasDefaultValueSql("NOW()");
        e.Property(x => x.ExpiresAt).HasDefaultValueSql("NOW() + INTERVAL '24 hours'");
        e.Property(x => x.IsActive).HasDefaultValue(true);
        e.Property(x => x.IsRevoked).HasDefaultValue(false);
        e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.IsDeleted).HasDefaultValue(false);

        e.HasIndex(x => x.UserId);
        e.HasIndex(x => x.SessionToken).IsUnique();
        e.HasIndex(x => x.DeviceFingerprint);
        e.HasIndex(x => x.StartedAt);
        e.HasIndex(x => x.LastActivity);
        e.HasIndex(x => x.ExpiresAt);
        e.HasIndex(x => x.IsActive);
        e.HasIndex(x => x.IsRevoked);
        e.HasIndex(x => new { x.UserId, x.IsActive, x.ExpiresAt })
            .HasDatabaseName("IX_UserSessions_ActiveSessions");

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

    private static void ConfigureUserCalendarConnection(ModelBuilder mb)
    {
        var e = mb.Entity<UserCalendarConnection>();
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).HasMaxLength(450).ValueGeneratedOnAdd();
        e.Property(x => x.UserId).IsRequired().HasMaxLength(450);
        e.Property(x => x.Provider).IsRequired().HasMaxLength(50);
        e.Property(x => x.AccessToken).IsRequired().HasColumnType("text");
        e.Property(x => x.RefreshToken).IsRequired().HasColumnType("text");
        e.Property(x => x.CalendarId).HasMaxLength(450);
        e.Property(x => x.ProviderEmail).HasMaxLength(256);
        e.Property(x => x.SyncEnabled).HasDefaultValue(true);
        e.Property(x => x.SyncCount).HasDefaultValue(0);
        e.Property(x => x.LastSyncError).HasMaxLength(1000);
        e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.IsDeleted).HasDefaultValue(false);

        // Unique constraint: one connection per user per provider
        e.HasIndex(x => new { x.UserId, x.Provider })
            .IsUnique()
            .HasDatabaseName("IX_UserCalendarConnections_UserProvider");

        // Index for finding connections needing refresh
        e.HasIndex(x => new { x.SyncEnabled, x.TokenExpiresAt, x.IsDeleted })
            .HasDatabaseName("IX_UserCalendarConnections_TokenRefresh");

        // Soft delete filter
        e.HasQueryFilter(x => !x.IsDeleted);

        // Relationship to User
        e.HasOne(x => x.User)
         .WithMany()
         .HasForeignKey(x => x.UserId)
         .OnDelete(DeleteBehavior.Cascade);
    }

    private static void ConfigureAppointmentCalendarEvent(ModelBuilder mb)
    {
        var e = mb.Entity<AppointmentCalendarEvent>();
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).HasMaxLength(450).ValueGeneratedOnAdd();
        e.Property(x => x.AppointmentId).IsRequired().HasMaxLength(450);
        e.Property(x => x.UserId).IsRequired().HasMaxLength(450);
        e.Property(x => x.Provider).IsRequired().HasMaxLength(50);
        e.Property(x => x.ExternalEventId).IsRequired().HasMaxLength(1000);
        e.Property(x => x.CalendarId).HasMaxLength(450);
        e.Property(x => x.Status).IsRequired().HasMaxLength(50).HasDefaultValue(CalendarEventStatus.Created);
        e.Property(x => x.ErrorMessage).HasMaxLength(1000);
        e.Property(x => x.SyncedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.IsDeleted).HasDefaultValue(false);

        // Unique constraint: one event per appointment per user per provider
        e.HasIndex(x => new { x.AppointmentId, x.UserId, x.Provider })
            .IsUnique()
            .HasDatabaseName("IX_AppointmentCalendarEvents_Unique");

        // Index for looking up by appointment
        e.HasIndex(x => x.AppointmentId)
            .HasDatabaseName("IX_AppointmentCalendarEvents_AppointmentId");

        // Index for looking up by external event
        e.HasIndex(x => new { x.ExternalEventId, x.Provider })
            .HasDatabaseName("IX_AppointmentCalendarEvents_External");

        // Soft delete filter
        e.HasQueryFilter(x => !x.IsDeleted);

        // Relationship to User
        e.HasOne(x => x.User)
         .WithMany()
         .HasForeignKey(x => x.UserId)
         .OnDelete(DeleteBehavior.Cascade);

        // Relationship to CalendarConnection (optional - may be null if connection was deleted)
        e.HasOne(x => x.CalendarConnection)
         .WithMany()
         .HasForeignKey(x => new { x.UserId, x.Provider })
         .HasPrincipalKey(c => new { c.UserId, c.Provider })
         .OnDelete(DeleteBehavior.SetNull)
         .IsRequired(false);
    }

    private static void ConfigureUserExperience(ModelBuilder mb)
    {
        var e = mb.Entity<UserExperience>();
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).HasMaxLength(450).ValueGeneratedOnAdd();
        e.Property(x => x.UserId).IsRequired().HasMaxLength(450);
        e.Property(x => x.Title).IsRequired().HasMaxLength(200);
        e.Property(x => x.Company).IsRequired().HasMaxLength(200);
        e.Property(x => x.StartDate).IsRequired();
        e.Property(x => x.Description).HasMaxLength(1000);
        e.Property(x => x.Location).HasMaxLength(200);
        e.Property(x => x.SortOrder).HasDefaultValue(0);
        e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");

        e.Property(x => x.Source).HasMaxLength(20).HasDefaultValue("manual");
        e.Property(x => x.ExternalId).HasMaxLength(100);

        e.HasIndex(x => x.UserId);
        e.HasIndex(x => new { x.UserId, x.SortOrder })
            .HasDatabaseName("IX_UserExperiences_UserSort");
        e.HasIndex(x => new { x.UserId, x.Source, x.ExternalId })
            .HasDatabaseName("IX_UserExperiences_SourceExternal");

        e.HasOne(x => x.User)
         .WithMany(u => u.Experiences)
         .HasForeignKey(x => x.UserId)
         .OnDelete(DeleteBehavior.Cascade);
    }

    private static void ConfigureUserEducation(ModelBuilder mb)
    {
        var e = mb.Entity<UserEducation>();
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).HasMaxLength(450).ValueGeneratedOnAdd();
        e.Property(x => x.UserId).IsRequired().HasMaxLength(450);
        e.Property(x => x.Degree).IsRequired().HasMaxLength(200);
        e.Property(x => x.Institution).IsRequired().HasMaxLength(200);
        e.Property(x => x.FieldOfStudy).HasMaxLength(200);
        e.Property(x => x.Description).HasMaxLength(1000);
        e.Property(x => x.SortOrder).HasDefaultValue(0);
        e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");

        e.Property(x => x.Source).HasMaxLength(20).HasDefaultValue("manual");
        e.Property(x => x.ExternalId).HasMaxLength(100);

        e.HasIndex(x => x.UserId);
        e.HasIndex(x => new { x.UserId, x.SortOrder })
            .HasDatabaseName("IX_UserEducation_UserSort");
        e.HasIndex(x => new { x.UserId, x.Source, x.ExternalId })
            .HasDatabaseName("IX_UserEducation_SourceExternal");

        e.HasOne(x => x.User)
         .WithMany(u => u.Education)
         .HasForeignKey(x => x.UserId)
         .OnDelete(DeleteBehavior.Cascade);
    }

    private static void ConfigureUserReview(ModelBuilder mb)
    {
        var e = mb.Entity<UserReview>();
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).HasMaxLength(450).ValueGeneratedOnAdd();
        e.Property(x => x.ReviewerId).IsRequired().HasMaxLength(450);
        e.Property(x => x.RevieweeId).IsRequired().HasMaxLength(450);
        e.Property(x => x.SessionId).HasMaxLength(450);
        e.Property(x => x.SkillId).HasMaxLength(450);
        e.Property(x => x.Rating).IsRequired();
        e.Property(x => x.ReviewText).HasMaxLength(2000);
        e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.IsDeleted).HasDefaultValue(false);

        // Indexes
        e.HasIndex(x => x.ReviewerId);
        e.HasIndex(x => x.RevieweeId);
        e.HasIndex(x => x.SessionId);
        e.HasIndex(x => x.SkillId);
        e.HasIndex(x => x.Rating);
        e.HasIndex(x => x.CreatedAt);
        e.HasIndex(x => new { x.RevieweeId, x.CreatedAt })
            .HasDatabaseName("IX_UserReviews_RevieweeRecent");
        e.HasIndex(x => new { x.RevieweeId, x.Rating })
            .HasDatabaseName("IX_UserReviews_RevieweeRating");

        // Prevent duplicate reviews for same session
        e.HasIndex(x => new { x.ReviewerId, x.SessionId })
            .IsUnique()
            .HasFilter("\"SessionId\" IS NOT NULL")
            .HasDatabaseName("IX_UserReviews_UniqueSessionReview");

        // Soft delete filter
        e.HasQueryFilter(x => !x.IsDeleted);

        // Relationships are configured in ConfigureUser
    }

    private static void ConfigureUserAvailability(ModelBuilder mb)
    {
        var e = mb.Entity<UserAvailability>();
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).HasMaxLength(450).ValueGeneratedOnAdd();
        e.Property(x => x.UserId).IsRequired().HasMaxLength(450);
        e.Property(x => x.DayOfWeek).IsRequired().HasMaxLength(20);
        e.Property(x => x.StartTime).IsRequired().HasMaxLength(10);
        e.Property(x => x.EndTime).IsRequired().HasMaxLength(10);
        e.Property(x => x.TimeZone).HasMaxLength(100);
        e.Property(x => x.IsActive).HasDefaultValue(true);
        e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.IsDeleted).HasDefaultValue(false);

        // Indexes
        e.HasIndex(x => x.UserId);
        e.HasIndex(x => new { x.UserId, x.DayOfWeek })
            .HasDatabaseName("IX_UserAvailabilities_UserDay");
        e.HasIndex(x => new { x.UserId, x.IsActive })
            .HasDatabaseName("IX_UserAvailabilities_UserActive");

        // Soft delete filter
        e.HasQueryFilter(x => !x.IsDeleted);
    }

    private static void ConfigureUserBlockedDate(ModelBuilder mb)
    {
        var e = mb.Entity<UserBlockedDate>();
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).HasMaxLength(450).ValueGeneratedOnAdd();
        e.Property(x => x.UserId).IsRequired().HasMaxLength(450);
        e.Property(x => x.BlockedDate).IsRequired();
        e.Property(x => x.StartTime).HasMaxLength(10);
        e.Property(x => x.EndTime).HasMaxLength(10);
        e.Property(x => x.Reason).HasMaxLength(200);
        e.Property(x => x.RecurrencePattern).HasMaxLength(50);
        e.Property(x => x.IsAllDay).HasDefaultValue(true);
        e.Property(x => x.IsRecurring).HasDefaultValue(false);
        e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.IsDeleted).HasDefaultValue(false);

        // Indexes
        e.HasIndex(x => x.UserId);
        e.HasIndex(x => x.BlockedDate);
        e.HasIndex(x => new { x.UserId, x.BlockedDate })
            .HasDatabaseName("IX_UserBlockedDates_UserDate");
        e.HasIndex(x => new { x.UserId, x.BlockedDate, x.EndDate })
            .HasDatabaseName("IX_UserBlockedDates_UserDateRange");

        // Soft delete filter
        e.HasQueryFilter(x => !x.IsDeleted);
    }

    private static void ConfigureUserPreferenceEntity(ModelBuilder mb)
    {
        var e = mb.Entity<UserPreferenceEntity>();
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).HasMaxLength(450).ValueGeneratedOnAdd();
        e.Property(x => x.UserId).IsRequired().HasMaxLength(450);
        e.Property(x => x.Language).HasMaxLength(10).HasDefaultValue("en");
        e.Property(x => x.Theme).HasMaxLength(20).HasDefaultValue("light");
        e.Property(x => x.DateFormat).HasMaxLength(20).HasDefaultValue("MM/dd/yyyy");
        e.Property(x => x.TimeFormat).HasMaxLength(10).HasDefaultValue("12h");
        e.Property(x => x.ShowOnlineStatus).HasDefaultValue(true);
        e.Property(x => x.PublicProfile).HasDefaultValue(true);
        e.Property(x => x.ShowLastActive).HasDefaultValue(true);
        e.Property(x => x.AllowSearchEngineIndexing).HasDefaultValue(false);
        e.Property(x => x.ShowSkills).HasDefaultValue(true);
        e.Property(x => x.ShowReviews).HasDefaultValue(true);
        e.Property(x => x.AllowMessagesFromAnyone).HasDefaultValue(false);
        e.Property(x => x.AutoAcceptMatches).HasDefaultValue(false);
        e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.IsDeleted).HasDefaultValue(false);

        // Unique constraint on UserId
        e.HasIndex(x => x.UserId).IsUnique();

        // Soft delete filter
        e.HasQueryFilter(x => !x.IsDeleted);
    }

    private static void ConfigureUserNotificationPreference(ModelBuilder mb)
    {
        var e = mb.Entity<UserNotificationPreference>();
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).HasMaxLength(450).ValueGeneratedOnAdd();
        e.Property(x => x.UserId).IsRequired().HasMaxLength(450);
        e.Property(x => x.EmailEnabled).HasDefaultValue(true);
        e.Property(x => x.PushEnabled).HasDefaultValue(true);
        e.Property(x => x.SmsEnabled).HasDefaultValue(false);
        e.Property(x => x.InAppEnabled).HasDefaultValue(true);
        e.Property(x => x.MessagesEnabled).HasDefaultValue(true);
        e.Property(x => x.MatchRequestsEnabled).HasDefaultValue(true);
        e.Property(x => x.AppointmentRemindersEnabled).HasDefaultValue(true);
        e.Property(x => x.ReviewsEnabled).HasDefaultValue(true);
        e.Property(x => x.SystemAnnouncementsEnabled).HasDefaultValue(true);
        e.Property(x => x.MarketingEnabled).HasDefaultValue(false);
        e.Property(x => x.WeeklyDigestEnabled).HasDefaultValue(true);
        e.Property(x => x.QuietHoursEnabled).HasDefaultValue(false);
        e.Property(x => x.QuietHoursStart).HasMaxLength(10);
        e.Property(x => x.QuietHoursEnd).HasMaxLength(10);
        e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.IsDeleted).HasDefaultValue(false);

        // Unique constraint on UserId
        e.HasIndex(x => x.UserId).IsUnique();

        // Soft delete filter
        e.HasQueryFilter(x => !x.IsDeleted);
    }

    private static void ConfigureUserVerification(ModelBuilder mb)
    {
        var e = mb.Entity<UserVerification>();
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).HasMaxLength(450).ValueGeneratedOnAdd();
        e.Property(x => x.UserId).IsRequired().HasMaxLength(450);

        // 2FA
        e.Property(x => x.TwoFactorEnabled).HasDefaultValue(false);
        e.Property(x => x.TwoFactorSecret).HasMaxLength(100);
        e.Property(x => x.TwoFactorBackupCodesJson).HasColumnType("text");

        // Email verification
        e.Property(x => x.EmailVerificationToken).HasMaxLength(100);
        e.Property(x => x.EmailVerificationAttempts).HasDefaultValue(0);

        // Phone verification
        e.Property(x => x.PhoneVerificationCode).HasMaxLength(100);
        e.Property(x => x.PhoneVerificationAttempts).HasDefaultValue(0);
        e.Property(x => x.PhoneVerificationFailedAttempts).HasDefaultValue(0);

        e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.IsDeleted).HasDefaultValue(false);

        // Unique constraint on UserId
        e.HasIndex(x => x.UserId).IsUnique();

        // Indexes for token lookups
        e.HasIndex(x => x.EmailVerificationToken)
            .HasDatabaseName("IX_UserVerifications_EmailToken");
        e.HasIndex(x => x.PhoneVerificationCode)
            .HasDatabaseName("IX_UserVerifications_PhoneCode");

        // Soft delete filter
        e.HasQueryFilter(x => !x.IsDeleted);
    }

    private static void ConfigureUserLoginHistory(ModelBuilder mb)
    {
        var e = mb.Entity<UserLoginHistory>();
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).HasMaxLength(450).ValueGeneratedOnAdd();
        e.Property(x => x.UserId).IsRequired().HasMaxLength(450);

        // Last login info
        e.Property(x => x.LastLoginIp).HasMaxLength(45);
        e.Property(x => x.LastLoginUserAgent).HasMaxLength(500);
        e.Property(x => x.LastLoginLocation).HasMaxLength(100);
        e.Property(x => x.LastLoginDeviceType).HasMaxLength(50);

        // Failed login tracking
        e.Property(x => x.FailedLoginAttempts).HasDefaultValue(0);
        e.Property(x => x.LastFailedLoginIp).HasMaxLength(45);

        // Lockout
        e.Property(x => x.LockoutReason).HasMaxLength(500);
        e.Property(x => x.TotalLockoutCount).HasDefaultValue(0);

        // Statistics
        e.Property(x => x.TotalSuccessfulLogins).HasDefaultValue(0);
        e.Property(x => x.TotalFailedLogins).HasDefaultValue(0);

        e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.IsDeleted).HasDefaultValue(false);

        // Unique constraint on UserId
        e.HasIndex(x => x.UserId).IsUnique();

        // Indexes
        e.HasIndex(x => x.LastLoginAt)
            .HasDatabaseName("IX_UserLoginHistories_LastLogin");
        e.HasIndex(x => x.AccountLockedUntil)
            .HasDatabaseName("IX_UserLoginHistories_Lockout");

        // Soft delete filter
        e.HasQueryFilter(x => !x.IsDeleted);
    }

    private static void ConfigureUserPasswordReset(ModelBuilder mb)
    {
        var e = mb.Entity<UserPasswordReset>();
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).HasMaxLength(450).ValueGeneratedOnAdd();
        e.Property(x => x.UserId).IsRequired().HasMaxLength(450);

        // Reset token
        e.Property(x => x.ResetToken).HasMaxLength(100);
        e.Property(x => x.ResetRequestedFromIp).HasMaxLength(45);

        // Password change tracking
        e.Property(x => x.PasswordChangedFromIp).HasMaxLength(45);
        e.Property(x => x.TotalPasswordChanges).HasDefaultValue(0);

        // Rate limiting
        e.Property(x => x.ResetRequestCount).HasDefaultValue(0);

        e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.IsDeleted).HasDefaultValue(false);

        // Unique constraint on UserId
        e.HasIndex(x => x.UserId).IsUnique();

        // Index for token lookup
        e.HasIndex(x => x.ResetToken)
            .HasDatabaseName("IX_UserPasswordResets_Token");

        // Soft delete filter
        e.HasQueryFilter(x => !x.IsDeleted);
    }

    private static void ConfigureUserStatistics(ModelBuilder mb)
    {
        var e = mb.Entity<UserStatistics>();
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).HasMaxLength(450).ValueGeneratedOnAdd();
        e.Property(x => x.UserId).IsRequired().HasMaxLength(450);

        // Experience
        e.Property(x => x.TotalExperienceMonths).HasDefaultValue(0);
        e.Property(x => x.ExperienceCount).HasDefaultValue(0);
        e.Property(x => x.PrimaryJobTitle).HasMaxLength(200);
        e.Property(x => x.PrimaryIndustry).HasMaxLength(200);

        // Skills
        e.Property(x => x.SkillsOfferedCount).HasDefaultValue(0);
        e.Property(x => x.SkillsWantedCount).HasDefaultValue(0);
        e.Property(x => x.TotalEndorsementsReceived).HasDefaultValue(0);

        // Matches & Sessions
        e.Property(x => x.MatchesCompletedCount).HasDefaultValue(0);
        e.Property(x => x.SessionsCompletedCount).HasDefaultValue(0);
        e.Property(x => x.TotalSessionHours).HasPrecision(10, 2).HasDefaultValue(0);

        // Reviews
        e.Property(x => x.AverageRating).HasPrecision(3, 2);
        e.Property(x => x.ReviewsReceivedCount).HasDefaultValue(0);
        e.Property(x => x.ReviewsGivenCount).HasDefaultValue(0);

        // Activity
        e.Property(x => x.ProfileViewCount).HasDefaultValue(0);

        e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.IsDeleted).HasDefaultValue(false);

        // Unique constraint on UserId
        e.HasIndex(x => x.UserId).IsUnique();

        // Indexes for filtering
        e.HasIndex(x => x.TotalExperienceMonths)
            .HasDatabaseName("IX_UserStatistics_Experience");
        e.HasIndex(x => x.AverageRating)
            .HasDatabaseName("IX_UserStatistics_Rating");
        e.HasIndex(x => new { x.TotalExperienceMonths, x.AverageRating })
            .HasDatabaseName("IX_UserStatistics_ExperienceRating");

        // Soft delete filter
        e.HasQueryFilter(x => !x.IsDeleted);
    }

    private static void ConfigureUserLinkedInConnection(ModelBuilder mb)
    {
        var e = mb.Entity<UserLinkedInConnection>();
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).HasMaxLength(450).ValueGeneratedOnAdd();
        e.Property(x => x.UserId).IsRequired().HasMaxLength(450);
        e.Property(x => x.LinkedInId).IsRequired().HasMaxLength(100);
        e.Property(x => x.AccessToken).IsRequired().HasColumnType("text");
        e.Property(x => x.RefreshToken).HasColumnType("text");
        e.Property(x => x.ProfileUrl).HasMaxLength(500);
        e.Property(x => x.LinkedInEmail).HasMaxLength(256);
        e.Property(x => x.IsVerified).HasDefaultValue(false);
        e.Property(x => x.SyncCount).HasDefaultValue(0);
        e.Property(x => x.ImportedExperienceCount).HasDefaultValue(0);
        e.Property(x => x.ImportedEducationCount).HasDefaultValue(0);
        e.Property(x => x.AutoSyncEnabled).HasDefaultValue(false);
        e.Property(x => x.LastSyncError).HasMaxLength(1000);
        e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.IsDeleted).HasDefaultValue(false);

        // Unique constraint: one LinkedIn connection per user
        e.HasIndex(x => x.UserId).IsUnique()
            .HasDatabaseName("IX_UserLinkedInConnections_UserId");
        e.HasIndex(x => x.LinkedInId).IsUnique()
            .HasDatabaseName("IX_UserLinkedInConnections_LinkedInId");

        // Index for finding connections needing refresh
        e.HasIndex(x => new { x.AutoSyncEnabled, x.TokenExpiresAt, x.IsDeleted })
            .HasDatabaseName("IX_UserLinkedInConnections_AutoSync");

        // Soft delete filter
        e.HasQueryFilter(x => !x.IsDeleted);
    }

    private static void ConfigureUserXingConnection(ModelBuilder mb)
    {
        var e = mb.Entity<UserXingConnection>();
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).HasMaxLength(450).ValueGeneratedOnAdd();
        e.Property(x => x.UserId).IsRequired().HasMaxLength(450);
        e.Property(x => x.XingId).IsRequired().HasMaxLength(100);
        e.Property(x => x.AccessToken).IsRequired().HasColumnType("text");
        e.Property(x => x.TokenSecret).IsRequired().HasColumnType("text");
        e.Property(x => x.ProfileUrl).HasMaxLength(500);
        e.Property(x => x.XingEmail).HasMaxLength(256);
        e.Property(x => x.IsVerified).HasDefaultValue(false);
        e.Property(x => x.SyncCount).HasDefaultValue(0);
        e.Property(x => x.ImportedExperienceCount).HasDefaultValue(0);
        e.Property(x => x.ImportedEducationCount).HasDefaultValue(0);
        e.Property(x => x.AutoSyncEnabled).HasDefaultValue(false);
        e.Property(x => x.LastSyncError).HasMaxLength(1000);
        e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.IsDeleted).HasDefaultValue(false);

        // Unique constraint: one Xing connection per user
        e.HasIndex(x => x.UserId).IsUnique()
            .HasDatabaseName("IX_UserXingConnections_UserId");
        e.HasIndex(x => x.XingId).IsUnique()
            .HasDatabaseName("IX_UserXingConnections_XingId");

        // Index for auto sync
        e.HasIndex(x => new { x.AutoSyncEnabled, x.IsDeleted })
            .HasDatabaseName("IX_UserXingConnections_AutoSync");

        // Soft delete filter
        e.HasQueryFilter(x => !x.IsDeleted);
    }

    private static void ConfigureUserImportedSkill(ModelBuilder mb)
    {
        var e = mb.Entity<UserImportedSkill>();
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).HasMaxLength(450).ValueGeneratedOnAdd();
        e.Property(x => x.UserId).IsRequired().HasMaxLength(450);
        e.Property(x => x.Name).IsRequired().HasMaxLength(200);
        e.Property(x => x.NormalizedName).IsRequired().HasMaxLength(200);
        e.Property(x => x.Source).HasMaxLength(20).HasDefaultValue("manual");
        e.Property(x => x.ExternalId).HasMaxLength(100);
        e.Property(x => x.Category).HasMaxLength(100);
        e.Property(x => x.EndorsementCount).HasDefaultValue(0);
        e.Property(x => x.SortOrder).HasDefaultValue(0);
        e.Property(x => x.IsVisible).HasDefaultValue(true);
        e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        e.Property(x => x.IsDeleted).HasDefaultValue(false);

        // Indexes
        e.HasIndex(x => x.UserId)
            .HasDatabaseName("IX_UserImportedSkills_UserId");
        e.HasIndex(x => new { x.UserId, x.NormalizedName })
            .IsUnique()
            .HasDatabaseName("IX_UserImportedSkills_UserName");
        e.HasIndex(x => new { x.UserId, x.Source, x.ExternalId })
            .HasDatabaseName("IX_UserImportedSkills_SourceExternal");
        e.HasIndex(x => new { x.UserId, x.IsVisible, x.SortOrder })
            .HasDatabaseName("IX_UserImportedSkills_VisibleSort");

        // Soft delete filter
        e.HasQueryFilter(x => !x.IsDeleted);
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
