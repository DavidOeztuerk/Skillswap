using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UserService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveCategoryProficiencyLevelEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserCategoryProficiencies");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserCategoryProficiencies",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    UserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    CategoryId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    CategoryName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    ProficiencyLevelId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    ProficiencyLevelName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserCategoryProficiencies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserCategoryProficiencies_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserCategoryProficiencies_CategoryId",
                table: "UserCategoryProficiencies",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_UserCategoryProficiencies_Unique",
                table: "UserCategoryProficiencies",
                columns: new[] { "UserId", "CategoryId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserCategoryProficiencies_UserId",
                table: "UserCategoryProficiencies",
                column: "UserId");
        }
    }
}
