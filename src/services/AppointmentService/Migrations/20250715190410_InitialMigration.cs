using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppointmentService.Migrations
{
    /// <inheritdoc />
    public partial class InitialMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Appointments",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ScheduledDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DurationMinutes = table.Column<int>(type: "integer", nullable: false),
                    OrganizerUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    ParticipantUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Pending"),
                    CancellationReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SkillId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    MatchId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    MeetingType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true, defaultValue: "VideoCall"),
                    MeetingLink = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    IsReminder1Sent = table.Column<bool>(type: "boolean", nullable: false),
                    IsReminder2Sent = table.Column<bool>(type: "boolean", nullable: false),
                    IsFollowUpSent = table.Column<bool>(type: "boolean", nullable: false),
                    AcceptedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
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
                    table.PrimaryKey("PK_Appointments", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_MeetingType",
                table: "Appointments",
                column: "MeetingType");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_OrganizerUserId",
                table: "Appointments",
                column: "OrganizerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_ParticipantUserId",
                table: "Appointments",
                column: "ParticipantUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_ScheduledDate",
                table: "Appointments",
                column: "ScheduledDate");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_ScheduledDate_Status",
                table: "Appointments",
                columns: new[] { "ScheduledDate", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_Status",
                table: "Appointments",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Appointments");
        }
    }
}
