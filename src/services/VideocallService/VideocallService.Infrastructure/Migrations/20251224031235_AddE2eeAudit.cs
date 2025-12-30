using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VideocallService.Migrations
{
    /// <inheritdoc />
    public partial class AddE2eeAudit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "E2EEAuditLogs",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    SessionId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    RoomId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    FromUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    ToUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    MessageType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    KeyFingerprint = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    KeyGeneration = table.Column<int>(type: "integer", nullable: true),
                    Success = table.Column<bool>(type: "boolean", nullable: false),
                    ErrorCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ClientIpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PayloadSize = table.Column<int>(type: "integer", nullable: false),
                    ProcessingTimeMs = table.Column<int>(type: "integer", nullable: true),
                    ClientTimestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ServerTimestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    WasRateLimited = table.Column<bool>(type: "boolean", nullable: false),
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
                    table.PrimaryKey("PK_E2EEAuditLogs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_E2EEAuditLogs_FromUserId",
                table: "E2EEAuditLogs",
                column: "FromUserId");

            migrationBuilder.CreateIndex(
                name: "IX_E2EEAuditLogs_RoomId",
                table: "E2EEAuditLogs",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_E2EEAuditLogs_RoomId_ServerTimestamp",
                table: "E2EEAuditLogs",
                columns: new[] { "RoomId", "ServerTimestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_E2EEAuditLogs_ServerTimestamp",
                table: "E2EEAuditLogs",
                column: "ServerTimestamp");

            migrationBuilder.CreateIndex(
                name: "IX_E2EEAuditLogs_SessionId",
                table: "E2EEAuditLogs",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_E2EEAuditLogs_Success_ServerTimestamp",
                table: "E2EEAuditLogs",
                columns: new[] { "Success", "ServerTimestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_E2EEAuditLogs_WasRateLimited_ServerTimestamp",
                table: "E2EEAuditLogs",
                columns: new[] { "WasRateLimited", "ServerTimestamp" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "E2EEAuditLogs");
        }
    }
}
