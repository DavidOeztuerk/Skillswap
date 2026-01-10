using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace PaymentService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentService : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PaymentProducts",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    ProductType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    BoostType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Price = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false, defaultValue: "EUR"),
                    DurationDays = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    StripePriceId = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
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
                    table.PrimaryKey("PK_PaymentProducts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    ProductId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    ReferenceId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    ReferenceType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    StripeSessionId = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    StripePaymentIntentId = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false, defaultValue: "EUR"),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FailureReason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
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
                    table.PrimaryKey("PK_Payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Payments_PaymentProducts_ProductId",
                        column: x => x.ProductId,
                        principalTable: "PaymentProducts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "PaymentProducts",
                columns: new[] { "Id", "BoostType", "CreatedAt", "CreatedBy", "Currency", "DeletedAt", "DeletedBy", "Description", "DurationDays", "IsActive", "IsDeleted", "Name", "Price", "ProductType", "SortOrder", "StripePriceId", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { "prod_galerie_10", "Gallery", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "EUR", null, null, "Dein Listing erscheint in der Homepage-Galerie", 10, true, false, "Galerie", 24.99m, "ListingBoost", 4, null, null, null },
                    { "prod_highlight_7", "Highlight", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "EUR", null, null, "Dein Listing wird farblich hervorgehoben", 7, true, false, "Highlight", 6.99m, "ListingBoost", 2, null, null, null },
                    { "prod_hochschieben_7", "Refresh", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "EUR", null, null, "Dein Listing wird wieder auf Seite 1 angezeigt", 7, true, false, "Hochschieben", 3.99m, "ListingBoost", 1, null, null, null },
                    { "prod_top_7", "TopListing", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "EUR", null, null, "Dein Listing erscheint in den ersten 2 Plätzen", 7, true, false, "Top-Anzeige", 16.99m, "ListingBoost", 3, null, null, null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_PaymentProducts_IsActive",
                table: "PaymentProducts",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentProducts_ProductType",
                table: "PaymentProducts",
                column: "ProductType");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentProducts_SortOrder",
                table: "PaymentProducts",
                column: "SortOrder");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_CreatedAt",
                table: "Payments",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_ProductId",
                table: "Payments",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_Status",
                table: "Payments",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_StripeSessionId",
                table: "Payments",
                column: "StripeSessionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Payments_UserId",
                table: "Payments",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Payments");

            migrationBuilder.DropTable(
                name: "PaymentProducts");
        }
    }
}
