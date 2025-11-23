using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppointmentService.Migrations
{
    /// <inheritdoc />
    public partial class AddSessionHierarchy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Connections",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    MatchRequestId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    RequesterId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    TargetUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    ConnectionType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "SkillExchange"),
                    SkillId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    ExchangeSkillId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    PaymentRatePerHour = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    Currency = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    SessionBalanceMinutes = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Active"),
                    StatusReason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    TotalSessionsPlanned = table.Column<int>(type: "integer", nullable: false),
                    TotalSessionsCompleted = table.Column<int>(type: "integer", nullable: false),
                    EstablishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DissolvedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
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
                    table.PrimaryKey("PK_Connections", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SessionSeries",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    ConnectionId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    TeacherUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    LearnerUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    SkillId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    TotalSessions = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    CompletedSessions = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    DefaultDurationMinutes = table.Column<int>(type: "integer", nullable: false, defaultValue: 60),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Planned"),
                    StatusReason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    PlannedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
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
                    table.PrimaryKey("PK_SessionSeries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SessionSeries_Connections_ConnectionId",
                        column: x => x.ConnectionId,
                        principalTable: "Connections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SessionAppointments",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    SessionSeriesId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ScheduledDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DurationMinutes = table.Column<int>(type: "integer", nullable: false, defaultValue: 60),
                    SessionNumber = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    OrganizerUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    ParticipantUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Pending"),
                    MeetingType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true, defaultValue: "VideoCall"),
                    MeetingLink = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    MeetingLocation = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CancellationReason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CancelledByUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsLateCancellation = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    RescheduleRequestedByUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    ProposedRescheduleDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ProposedRescheduleDuration = table.Column<int>(type: "integer", nullable: true),
                    RescheduleReason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsNoShow = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    NoShowUserIds = table.Column<string>(type: "character varying(900)", maxLength: 900, nullable: true),
                    PaymentAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    Currency = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    IsPaymentCompleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    PaymentCompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsReminder24hSent = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    IsReminder1hSent = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    IsFollowUpSent = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    ConfirmedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
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
                    table.PrimaryKey("PK_SessionAppointments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SessionAppointments_SessionSeries_SessionSeriesId",
                        column: x => x.SessionSeriesId,
                        principalTable: "SessionSeries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Connections_ConnectionType",
                table: "Connections",
                column: "ConnectionType");

            migrationBuilder.CreateIndex(
                name: "IX_Connections_MatchRequestId",
                table: "Connections",
                column: "MatchRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_Connections_RequesterId",
                table: "Connections",
                column: "RequesterId");

            migrationBuilder.CreateIndex(
                name: "IX_Connections_RequesterId_TargetUserId",
                table: "Connections",
                columns: new[] { "RequesterId", "TargetUserId" });

            migrationBuilder.CreateIndex(
                name: "IX_Connections_Status",
                table: "Connections",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Connections_Status_EstablishedAt",
                table: "Connections",
                columns: new[] { "Status", "EstablishedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Connections_TargetUserId",
                table: "Connections",
                column: "TargetUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionAppointments_MeetingType",
                table: "SessionAppointments",
                column: "MeetingType");

            migrationBuilder.CreateIndex(
                name: "IX_SessionAppointments_OrganizerUserId",
                table: "SessionAppointments",
                column: "OrganizerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionAppointments_OrganizerUserId_Status",
                table: "SessionAppointments",
                columns: new[] { "OrganizerUserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_SessionAppointments_ParticipantUserId",
                table: "SessionAppointments",
                column: "ParticipantUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionAppointments_ParticipantUserId_Status",
                table: "SessionAppointments",
                columns: new[] { "ParticipantUserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_SessionAppointments_ScheduledDate",
                table: "SessionAppointments",
                column: "ScheduledDate");

            migrationBuilder.CreateIndex(
                name: "IX_SessionAppointments_ScheduledDate_OrganizerUserId",
                table: "SessionAppointments",
                columns: new[] { "ScheduledDate", "OrganizerUserId" });

            migrationBuilder.CreateIndex(
                name: "IX_SessionAppointments_ScheduledDate_ParticipantUserId",
                table: "SessionAppointments",
                columns: new[] { "ScheduledDate", "ParticipantUserId" });

            migrationBuilder.CreateIndex(
                name: "IX_SessionAppointments_ScheduledDate_Status",
                table: "SessionAppointments",
                columns: new[] { "ScheduledDate", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_SessionAppointments_SessionSeriesId",
                table: "SessionAppointments",
                column: "SessionSeriesId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionAppointments_SessionSeriesId_SessionNumber",
                table: "SessionAppointments",
                columns: new[] { "SessionSeriesId", "SessionNumber" });

            migrationBuilder.CreateIndex(
                name: "IX_SessionAppointments_Status",
                table: "SessionAppointments",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_SessionSeries_ConnectionId",
                table: "SessionSeries",
                column: "ConnectionId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionSeries_ConnectionId_Status",
                table: "SessionSeries",
                columns: new[] { "ConnectionId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_SessionSeries_LearnerUserId",
                table: "SessionSeries",
                column: "LearnerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionSeries_LearnerUserId_Status",
                table: "SessionSeries",
                columns: new[] { "LearnerUserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_SessionSeries_SkillId",
                table: "SessionSeries",
                column: "SkillId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionSeries_Status",
                table: "SessionSeries",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_SessionSeries_TeacherUserId",
                table: "SessionSeries",
                column: "TeacherUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionSeries_TeacherUserId_Status",
                table: "SessionSeries",
                columns: new[] { "TeacherUserId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SessionAppointments");

            migrationBuilder.DropTable(
                name: "SessionSeries");

            migrationBuilder.DropTable(
                name: "Connections");
        }
    }
}
