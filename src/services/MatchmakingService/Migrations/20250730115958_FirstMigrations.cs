using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatchmakingService.Migrations
{
    /// <inheritdoc />
    public partial class FirstMigrations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Matches",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    OfferedSkillId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    RequestedSkillId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    OfferingUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    RequestingUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    OfferedSkillName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    RequestedSkillName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Pending"),
                    CompatibilityScore = table.Column<double>(type: "double precision", nullable: false),
                    MatchReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsSkillExchange = table.Column<bool>(type: "boolean", nullable: false),
                    ExchangeSkillId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    ExchangeSkillName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IsMonetary = table.Column<bool>(type: "boolean", nullable: false),
                    AgreedAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: true),
                    AgreedDays = table.Column<string>(type: "text", nullable: false),
                    AgreedTimes = table.Column<string>(type: "text", nullable: false),
                    TotalSessionsPlanned = table.Column<int>(type: "integer", nullable: false),
                    CompletedSessions = table.Column<int>(type: "integer", nullable: false),
                    OriginalRequestId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    ThreadId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    AcceptedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RejectedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExpiredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RejectionReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CompletionNotes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    SessionDurationMinutes = table.Column<int>(type: "integer", nullable: true),
                    RatingByOffering = table.Column<int>(type: "integer", nullable: true),
                    RatingByRequesting = table.Column<int>(type: "integer", nullable: true),
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
                    table.PrimaryKey("PK_Matches", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MatchRequests",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    SkillId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    RequesterId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    TargetUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ThreadId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    IsSkillExchange = table.Column<bool>(type: "boolean", nullable: false),
                    ExchangeSkillId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    IsMonetaryOffer = table.Column<bool>(type: "boolean", nullable: false),
                    OfferedAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: true, defaultValue: "EUR"),
                    PreferredDays = table.Column<List<string>>(type: "text[]", nullable: false),
                    PreferredTimes = table.Column<List<string>>(type: "text[]", nullable: false),
                    SessionDurationMinutes = table.Column<int>(type: "integer", nullable: true),
                    TotalSessions = table.Column<int>(type: "integer", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ViewCount = table.Column<int>(type: "integer", nullable: false),
                    MatchAttempts = table.Column<int>(type: "integer", nullable: false),
                    PreferredTags = table.Column<string>(type: "text", nullable: false),
                    RequiredSkills = table.Column<string>(type: "text", nullable: false),
                    ResponseMessage = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    RespondedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ParentRequestId = table.Column<string>(type: "text", nullable: true),
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
                    table.PrimaryKey("PK_MatchRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MatchRequests_MatchRequests_ParentRequestId",
                        column: x => x.ParentRequestId,
                        principalTable: "MatchRequests",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Matches_CreatedAt",
                table: "Matches",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Matches_OfferingUserId",
                table: "Matches",
                column: "OfferingUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Matches_OriginalRequestId",
                table: "Matches",
                column: "OriginalRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_Matches_RequestingUserId",
                table: "Matches",
                column: "RequestingUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Matches_Status",
                table: "Matches",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Matches_Status_CreatedAt",
                table: "Matches",
                columns: new[] { "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Matches_ThreadId",
                table: "Matches",
                column: "ThreadId");

            migrationBuilder.CreateIndex(
                name: "IX_MatchRequests_ParentRequestId",
                table: "MatchRequests",
                column: "ParentRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_MatchRequests_RequesterId",
                table: "MatchRequests",
                column: "RequesterId");

            migrationBuilder.CreateIndex(
                name: "IX_MatchRequests_SkillId",
                table: "MatchRequests",
                column: "SkillId");

            migrationBuilder.CreateIndex(
                name: "IX_MatchRequests_Status",
                table: "MatchRequests",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_MatchRequests_ThreadId",
                table: "MatchRequests",
                column: "ThreadId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Matches");

            migrationBuilder.DropTable(
                name: "MatchRequests");
        }
    }
}
