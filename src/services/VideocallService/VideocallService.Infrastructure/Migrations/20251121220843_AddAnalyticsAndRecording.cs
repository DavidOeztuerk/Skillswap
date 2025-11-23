using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VideocallService.Migrations
{
    /// <inheritdoc />
    public partial class AddAnalyticsAndRecording : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CallAnalytics",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    SessionId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    DurationSeconds = table.Column<int>(type: "integer", nullable: false),
                    ParticipantCount = table.Column<int>(type: "integer", nullable: false),
                    AverageNetworkQuality = table.Column<decimal>(type: "numeric", nullable: false),
                    ReconnectionAttempts = table.Column<int>(type: "integer", nullable: false),
                    SuccessfulReconnections = table.Column<int>(type: "integer", nullable: false),
                    AveragePacketLoss = table.Column<decimal>(type: "numeric", nullable: false),
                    AverageJitter = table.Column<decimal>(type: "numeric", nullable: false),
                    AverageRoundTripTime = table.Column<decimal>(type: "numeric", nullable: false),
                    PeakBandwidth = table.Column<int>(type: "integer", nullable: false),
                    AverageBandwidth = table.Column<int>(type: "integer", nullable: false),
                    ChatMessageCount = table.Column<int>(type: "integer", nullable: false),
                    ScreenSharingUsed = table.Column<bool>(type: "boolean", nullable: false),
                    ScreenSharingDurationSeconds = table.Column<int>(type: "integer", nullable: false),
                    WasRecorded = table.Column<bool>(type: "boolean", nullable: false),
                    EndReason = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    UserRating = table.Column<int>(type: "integer", nullable: true),
                    UserFeedback = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Metadata = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
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
                    table.PrimaryKey("PK_CallAnalytics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CallAnalytics_VideoCallSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "VideoCallSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CallRecordings",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    SessionId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    InitiatedByUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StoppedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DurationSeconds = table.Column<int>(type: "integer", nullable: false),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    StorageUrl = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    DownloadUrl = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    UrlExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Format = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Codec = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Resolution = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Bitrate = table.Column<int>(type: "integer", nullable: true),
                    IncludesAudio = table.Column<bool>(type: "boolean", nullable: false),
                    IncludesVideo = table.Column<bool>(type: "boolean", nullable: false),
                    IncludesScreenShare = table.Column<bool>(type: "boolean", nullable: false),
                    DeleteAfter = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AllParticipantsConsented = table.Column<bool>(type: "boolean", nullable: false),
                    ConsentMetadata = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Metadata = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
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
                    table.PrimaryKey("PK_CallRecordings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CallRecordings_VideoCallSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "VideoCallSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CallAnalytics_CreatedAt",
                table: "CallAnalytics",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_CallAnalytics_SessionId",
                table: "CallAnalytics",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_CallAnalytics_SessionId_CreatedAt",
                table: "CallAnalytics",
                columns: new[] { "SessionId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_CallRecordings_CreatedAt",
                table: "CallRecordings",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_CallRecordings_InitiatedByUserId",
                table: "CallRecordings",
                column: "InitiatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CallRecordings_SessionId",
                table: "CallRecordings",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_CallRecordings_SessionId_Status",
                table: "CallRecordings",
                columns: new[] { "SessionId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_CallRecordings_Status",
                table: "CallRecordings",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CallAnalytics");

            migrationBuilder.DropTable(
                name: "CallRecordings");
        }
    }
}
