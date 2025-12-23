using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatchmakingService.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MatchRequests",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    SkillId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    RequesterId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    TargetUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    ThreadId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
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
                    AdditionalNotes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CompatibilityScore = table.Column<double>(type: "double precision", nullable: true),
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

            migrationBuilder.CreateTable(
                name: "Matches",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    AcceptedMatchRequestId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Accepted"),
                    AcceptedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DissolvedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DissolutionReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CompletedSessions = table.Column<int>(type: "integer", nullable: false),
                    NextSessionDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RatingByOffering = table.Column<int>(type: "integer", nullable: true),
                    RatingByRequesting = table.Column<int>(type: "integer", nullable: true),
                    CompletionNotes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
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
                    table.ForeignKey(
                        name: "FK_Matches_MatchRequests_AcceptedMatchRequestId",
                        column: x => x.AcceptedMatchRequestId,
                        principalTable: "MatchRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Matches_AcceptedMatchRequestId",
                table: "Matches",
                column: "AcceptedMatchRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_Matches_CreatedAt",
                table: "Matches",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Matches_Status",
                table: "Matches",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Matches_Status_CreatedAt",
                table: "Matches",
                columns: new[] { "Status", "CreatedAt" });

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
