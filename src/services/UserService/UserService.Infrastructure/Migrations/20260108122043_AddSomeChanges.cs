using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UserService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSomeChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReviewerAvatarUrl",
                table: "UserReviews");

            migrationBuilder.DropColumn(
                name: "ReviewerName",
                table: "UserReviews");

            migrationBuilder.DropColumn(
                name: "SkillName",
                table: "UserReviews");

            migrationBuilder.AddColumn<string>(
                name: "ExternalId",
                table: "UserExperiences",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ImportedAt",
                table: "UserExperiences",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Location",
                table: "UserExperiences",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Source",
                table: "UserExperiences",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "manual");

            migrationBuilder.AddColumn<string>(
                name: "ExternalId",
                table: "UserEducation",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FieldOfStudy",
                table: "UserEducation",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ImportedAt",
                table: "UserEducation",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Source",
                table: "UserEducation",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "manual");

            migrationBuilder.AddColumn<int>(
                name: "StartMonth",
                table: "UserEducation",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "StartYear",
                table: "UserEducation",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "UserAvailabilities",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    UserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    DayOfWeek = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    StartTime = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    EndTime = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    TimeZone = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserAvailabilities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserAvailabilities_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserBlockedDates",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    UserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    BlockedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsAllDay = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    StartTime = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    EndTime = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    Reason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    IsRecurring = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    RecurrencePattern = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserBlockedDates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserBlockedDates_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserImportedSkills",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    UserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    NormalizedName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Source = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "manual"),
                    ExternalId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    EndorsementCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    ImportedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastSyncAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    IsVisible = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserImportedSkills", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserImportedSkills_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserLinkedInConnections",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    UserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    LinkedInId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    AccessToken = table.Column<string>(type: "text", nullable: false),
                    RefreshToken = table.Column<string>(type: "text", nullable: true),
                    TokenExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ProfileUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    LinkedInEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    LastSyncAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SyncCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    LastSyncError = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsVerified = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    VerifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ImportedExperienceCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    ImportedEducationCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    AutoSyncEnabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserLinkedInConnections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserLinkedInConnections_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserLoginHistories",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    UserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastLoginIp = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    LastLoginUserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    LastLoginLocation = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    LastLoginDeviceType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    FailedLoginAttempts = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    LastFailedLoginAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastFailedLoginIp = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    AccountLockedUntil = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LockoutReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    TotalLockoutCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    TotalSuccessfulLogins = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    TotalFailedLogins = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserLoginHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserLoginHistories_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserNotificationPreferences",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    UserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    EmailEnabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    PushEnabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    SmsEnabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    InAppEnabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    MessagesEnabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    MatchRequestsEnabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    AppointmentRemindersEnabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    ReviewsEnabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    SystemAnnouncementsEnabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    MarketingEnabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    WeeklyDigestEnabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    QuietHoursEnabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    QuietHoursStart = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    QuietHoursEnd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserNotificationPreferences", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserNotificationPreferences_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserPasswordResets",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    UserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    ResetToken = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ResetTokenExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ResetTokenCreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ResetRequestedFromIp = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    PasswordChangedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PasswordChangedFromIp = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    TotalPasswordChanges = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    ResetRequestCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    ResetRequestCountResetAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ResetCooldownUntil = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserPasswordResets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserPasswordResets_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserPreferenceEntities",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    UserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    Language = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "en"),
                    Theme = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "light"),
                    DateFormat = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "MM/dd/yyyy"),
                    TimeFormat = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "12h"),
                    ShowOnlineStatus = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    PublicProfile = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    ShowLastActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    AllowSearchEngineIndexing = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    ShowSkills = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    ShowReviews = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    AllowMessagesFromAnyone = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    AutoAcceptMatches = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserPreferenceEntities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserPreferenceEntities_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserStatistics",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    UserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    TotalExperienceMonths = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    ExperienceCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    PrimaryJobTitle = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    PrimaryIndustry = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    SkillsOfferedCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    SkillsWantedCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    TotalEndorsementsReceived = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    MatchesCompletedCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    SessionsCompletedCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    TotalSessionHours = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false, defaultValue: 0m),
                    AverageRating = table.Column<double>(type: "double precision", precision: 3, scale: 2, nullable: true),
                    ReviewsReceivedCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    ReviewsGivenCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    MemberSince = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastActiveAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ProfileViewCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    LastCalculatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserStatistics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserStatistics_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserVerifications",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    UserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    TwoFactorSecret = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    TwoFactorBackupCodesJson = table.Column<string>(type: "text", nullable: true),
                    TwoFactorEnabledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EmailVerificationToken = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    EmailVerificationTokenExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EmailVerificationSentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EmailVerificationCooldownUntil = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EmailVerificationAttempts = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    EmailVerifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PhoneVerificationCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    PhoneVerificationExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PhoneVerificationSentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PhoneVerificationCooldownUntil = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PhoneVerificationAttempts = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    PhoneVerificationFailedAttempts = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    PhoneVerifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserVerifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserVerifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserXingConnections",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    UserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    XingId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    AccessToken = table.Column<string>(type: "text", nullable: false),
                    TokenSecret = table.Column<string>(type: "text", nullable: false),
                    ProfileUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    XingEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    LastSyncAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SyncCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    LastSyncError = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsVerified = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    VerifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ImportedExperienceCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    ImportedEducationCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    AutoSyncEnabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserXingConnections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserXingConnections_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserExperiences_SourceExternal",
                table: "UserExperiences",
                columns: new[] { "UserId", "Source", "ExternalId" });

            migrationBuilder.CreateIndex(
                name: "IX_UserEducation_SourceExternal",
                table: "UserEducation",
                columns: new[] { "UserId", "Source", "ExternalId" });

            migrationBuilder.CreateIndex(
                name: "IX_UserAvailabilities_UserActive",
                table: "UserAvailabilities",
                columns: new[] { "UserId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_UserAvailabilities_UserDay",
                table: "UserAvailabilities",
                columns: new[] { "UserId", "DayOfWeek" });

            migrationBuilder.CreateIndex(
                name: "IX_UserAvailabilities_UserId",
                table: "UserAvailabilities",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserBlockedDates_BlockedDate",
                table: "UserBlockedDates",
                column: "BlockedDate");

            migrationBuilder.CreateIndex(
                name: "IX_UserBlockedDates_UserDate",
                table: "UserBlockedDates",
                columns: new[] { "UserId", "BlockedDate" });

            migrationBuilder.CreateIndex(
                name: "IX_UserBlockedDates_UserDateRange",
                table: "UserBlockedDates",
                columns: new[] { "UserId", "BlockedDate", "EndDate" });

            migrationBuilder.CreateIndex(
                name: "IX_UserBlockedDates_UserId",
                table: "UserBlockedDates",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserImportedSkills_SourceExternal",
                table: "UserImportedSkills",
                columns: new[] { "UserId", "Source", "ExternalId" });

            migrationBuilder.CreateIndex(
                name: "IX_UserImportedSkills_UserId",
                table: "UserImportedSkills",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserImportedSkills_UserName",
                table: "UserImportedSkills",
                columns: new[] { "UserId", "NormalizedName" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserImportedSkills_VisibleSort",
                table: "UserImportedSkills",
                columns: new[] { "UserId", "IsVisible", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_UserLinkedInConnections_AutoSync",
                table: "UserLinkedInConnections",
                columns: new[] { "AutoSyncEnabled", "TokenExpiresAt", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_UserLinkedInConnections_LinkedInId",
                table: "UserLinkedInConnections",
                column: "LinkedInId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserLinkedInConnections_UserId",
                table: "UserLinkedInConnections",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserLoginHistories_LastLogin",
                table: "UserLoginHistories",
                column: "LastLoginAt");

            migrationBuilder.CreateIndex(
                name: "IX_UserLoginHistories_Lockout",
                table: "UserLoginHistories",
                column: "AccountLockedUntil");

            migrationBuilder.CreateIndex(
                name: "IX_UserLoginHistories_UserId",
                table: "UserLoginHistories",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserNotificationPreferences_UserId",
                table: "UserNotificationPreferences",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserPasswordResets_Token",
                table: "UserPasswordResets",
                column: "ResetToken");

            migrationBuilder.CreateIndex(
                name: "IX_UserPasswordResets_UserId",
                table: "UserPasswordResets",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserPreferenceEntities_UserId",
                table: "UserPreferenceEntities",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserStatistics_Experience",
                table: "UserStatistics",
                column: "TotalExperienceMonths");

            migrationBuilder.CreateIndex(
                name: "IX_UserStatistics_ExperienceRating",
                table: "UserStatistics",
                columns: new[] { "TotalExperienceMonths", "AverageRating" });

            migrationBuilder.CreateIndex(
                name: "IX_UserStatistics_Rating",
                table: "UserStatistics",
                column: "AverageRating");

            migrationBuilder.CreateIndex(
                name: "IX_UserStatistics_UserId",
                table: "UserStatistics",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserVerifications_EmailToken",
                table: "UserVerifications",
                column: "EmailVerificationToken");

            migrationBuilder.CreateIndex(
                name: "IX_UserVerifications_PhoneCode",
                table: "UserVerifications",
                column: "PhoneVerificationCode");

            migrationBuilder.CreateIndex(
                name: "IX_UserVerifications_UserId",
                table: "UserVerifications",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserXingConnections_AutoSync",
                table: "UserXingConnections",
                columns: new[] { "AutoSyncEnabled", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_UserXingConnections_UserId",
                table: "UserXingConnections",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserXingConnections_XingId",
                table: "UserXingConnections",
                column: "XingId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserAvailabilities");

            migrationBuilder.DropTable(
                name: "UserBlockedDates");

            migrationBuilder.DropTable(
                name: "UserImportedSkills");

            migrationBuilder.DropTable(
                name: "UserLinkedInConnections");

            migrationBuilder.DropTable(
                name: "UserLoginHistories");

            migrationBuilder.DropTable(
                name: "UserNotificationPreferences");

            migrationBuilder.DropTable(
                name: "UserPasswordResets");

            migrationBuilder.DropTable(
                name: "UserPreferenceEntities");

            migrationBuilder.DropTable(
                name: "UserStatistics");

            migrationBuilder.DropTable(
                name: "UserVerifications");

            migrationBuilder.DropTable(
                name: "UserXingConnections");

            migrationBuilder.DropIndex(
                name: "IX_UserExperiences_SourceExternal",
                table: "UserExperiences");

            migrationBuilder.DropIndex(
                name: "IX_UserEducation_SourceExternal",
                table: "UserEducation");

            migrationBuilder.DropColumn(
                name: "ExternalId",
                table: "UserExperiences");

            migrationBuilder.DropColumn(
                name: "ImportedAt",
                table: "UserExperiences");

            migrationBuilder.DropColumn(
                name: "Location",
                table: "UserExperiences");

            migrationBuilder.DropColumn(
                name: "Source",
                table: "UserExperiences");

            migrationBuilder.DropColumn(
                name: "ExternalId",
                table: "UserEducation");

            migrationBuilder.DropColumn(
                name: "FieldOfStudy",
                table: "UserEducation");

            migrationBuilder.DropColumn(
                name: "ImportedAt",
                table: "UserEducation");

            migrationBuilder.DropColumn(
                name: "Source",
                table: "UserEducation");

            migrationBuilder.DropColumn(
                name: "StartMonth",
                table: "UserEducation");

            migrationBuilder.DropColumn(
                name: "StartYear",
                table: "UserEducation");

            migrationBuilder.AddColumn<string>(
                name: "ReviewerAvatarUrl",
                table: "UserReviews",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReviewerName",
                table: "UserReviews",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SkillName",
                table: "UserReviews",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);
        }
    }
}
