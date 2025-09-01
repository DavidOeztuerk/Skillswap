using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkillService.Migrations
{
    /// <inheritdoc />
    public partial class Latest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Skills_ActiveSearch",
                table: "Skills",
                columns: new[] { "IsActive", "IsDeleted", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_Skills_Name",
                table: "Skills",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Skills_SearchKeywords",
                table: "Skills",
                column: "SearchKeywords");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Skills_ActiveSearch",
                table: "Skills");

            migrationBuilder.DropIndex(
                name: "IX_Skills_Name",
                table: "Skills");

            migrationBuilder.DropIndex(
                name: "IX_Skills_SearchKeywords",
                table: "Skills");
        }
    }
}
