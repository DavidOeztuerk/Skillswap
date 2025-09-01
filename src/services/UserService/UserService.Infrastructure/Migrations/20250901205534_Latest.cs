using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UserService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Latest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Users_Name",
                table: "Users",
                columns: new[] { "FirstName", "LastName" });

            migrationBuilder.CreateIndex(
                name: "IX_Users_Search",
                table: "Users",
                columns: new[] { "IsDeleted", "AccountStatus", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Users_VerificationStatus",
                table: "Users",
                columns: new[] { "EmailVerified", "AccountStatus" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_Name",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_Search",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_VerificationStatus",
                table: "Users");
        }
    }
}
