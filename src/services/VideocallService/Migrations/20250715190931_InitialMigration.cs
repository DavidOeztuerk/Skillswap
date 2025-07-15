using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VideocallService.Migrations
{
    /// <inheritdoc />
    public partial class InitialMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "VideoCallSessions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    RoomId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    InitiatorUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    ParticipantUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    AppointmentId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    MatchId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Pending"),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EndedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ActualDurationMinutes = table.Column<int>(type: "integer", nullable: true),
                    EndReason = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    SessionNotes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    QualityRating = table.Column<int>(type: "integer", nullable: true),
                    TechnicalIssues = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsRecorded = table.Column<bool>(type: "boolean", nullable: false),
                    RecordingUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ScreenShareUsed = table.Column<bool>(type: "boolean", nullable: false),
                    ChatUsed = table.Column<bool>(type: "boolean", nullable: false),
                    ParticipantCount = table.Column<int>(type: "integer", nullable: false),
                    MaxParticipants = table.Column<int>(type: "integer", nullable: false, defaultValue: 2),
                    ConnectedUserIds = table.Column<string>(type: "text", nullable: false),
                    ConnectionTimes = table.Column<string>(type: "text", nullable: false),
                    ConnectionIds = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VideoCallSessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CallParticipants",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    SessionId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    UserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    ConnectionId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LeftAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsInitiator = table.Column<bool>(type: "boolean", nullable: false),
                    CameraEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    MicrophoneEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    ScreenShareEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    DeviceInfo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ConnectionQuality = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CallParticipants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CallParticipants_VideoCallSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "VideoCallSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CallParticipants_ConnectionId",
                table: "CallParticipants",
                column: "ConnectionId");

            migrationBuilder.CreateIndex(
                name: "IX_CallParticipants_SessionId",
                table: "CallParticipants",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_CallParticipants_SessionId_UserId",
                table: "CallParticipants",
                columns: new[] { "SessionId", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_CallParticipants_UserId",
                table: "CallParticipants",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_VideoCallSessions_CreatedAt",
                table: "VideoCallSessions",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_VideoCallSessions_InitiatorUserId",
                table: "VideoCallSessions",
                column: "InitiatorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_VideoCallSessions_ParticipantUserId",
                table: "VideoCallSessions",
                column: "ParticipantUserId");

            migrationBuilder.CreateIndex(
                name: "IX_VideoCallSessions_RoomId",
                table: "VideoCallSessions",
                column: "RoomId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VideoCallSessions_Status",
                table: "VideoCallSessions",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_VideoCallSessions_Status_CreatedAt",
                table: "VideoCallSessions",
                columns: new[] { "Status", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CallParticipants");

            migrationBuilder.DropTable(
                name: "VideoCallSessions");
        }
    }
}
