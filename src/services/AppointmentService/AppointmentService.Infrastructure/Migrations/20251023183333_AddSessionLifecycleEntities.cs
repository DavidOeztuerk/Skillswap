using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppointmentService.Migrations
{
    /// <inheritdoc />
    public partial class AddSessionLifecycleEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SessionPayments",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    SessionAppointmentId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    PayerId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    PayeeId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "EUR"),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Pending"),
                    TransactionId = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Provider = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    PaymentMethod = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CardLast4 = table.Column<string>(type: "character varying(4)", maxLength: 4, nullable: true),
                    ProcessingStartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ProcessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ErrorMessage = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    RetryCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    MaxRetries = table.Column<int>(type: "integer", nullable: false, defaultValue: 3),
                    LastRetryAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RefundForPaymentId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    RefundReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    RefundedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PlatformFee = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false, defaultValue: 0m),
                    NetAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Metadata = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
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
                    table.PrimaryKey("PK_SessionPayments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SessionPayments_SessionAppointments_SessionAppointmentId",
                        column: x => x.SessionAppointmentId,
                        principalTable: "SessionAppointments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SessionRatings",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    SessionAppointmentId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    RaterId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    RateeId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: false),
                    Feedback = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    WouldRecommend = table.Column<bool>(type: "boolean", nullable: true),
                    Tags = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    RateeResponse = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    RateeResponseAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsFlagged = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    FlagReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
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
                    table.PrimaryKey("PK_SessionRatings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SessionRatings_SessionAppointments_SessionAppointmentId",
                        column: x => x.SessionAppointmentId,
                        principalTable: "SessionAppointments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SessionPayments_PayeeId",
                table: "SessionPayments",
                column: "PayeeId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionPayments_PayeeId_Status",
                table: "SessionPayments",
                columns: new[] { "PayeeId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_SessionPayments_PayerId",
                table: "SessionPayments",
                column: "PayerId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionPayments_PayerId_Status",
                table: "SessionPayments",
                columns: new[] { "PayerId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_SessionPayments_SessionAppointmentId",
                table: "SessionPayments",
                column: "SessionAppointmentId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionPayments_SessionAppointmentId_Status",
                table: "SessionPayments",
                columns: new[] { "SessionAppointmentId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_SessionPayments_Status",
                table: "SessionPayments",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_SessionPayments_Status_CreatedAt",
                table: "SessionPayments",
                columns: new[] { "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_SessionPayments_TransactionId",
                table: "SessionPayments",
                column: "TransactionId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionRatings_RateeId",
                table: "SessionRatings",
                column: "RateeId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionRatings_RateeId_CreatedAt",
                table: "SessionRatings",
                columns: new[] { "RateeId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_SessionRatings_RateeId_IsPublic",
                table: "SessionRatings",
                columns: new[] { "RateeId", "IsPublic" });

            migrationBuilder.CreateIndex(
                name: "IX_SessionRatings_RaterId",
                table: "SessionRatings",
                column: "RaterId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionRatings_Rating",
                table: "SessionRatings",
                column: "Rating");

            migrationBuilder.CreateIndex(
                name: "IX_SessionRatings_SessionAppointmentId",
                table: "SessionRatings",
                column: "SessionAppointmentId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionRatings_SessionAppointmentId_RaterId",
                table: "SessionRatings",
                columns: new[] { "SessionAppointmentId", "RaterId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SessionPayments");

            migrationBuilder.DropTable(
                name: "SessionRatings");
        }
    }
}
