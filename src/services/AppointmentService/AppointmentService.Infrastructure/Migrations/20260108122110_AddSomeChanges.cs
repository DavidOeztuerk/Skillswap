using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppointmentService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSomeChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReviewerAvatarUrl",
                table: "SessionRatings");

            migrationBuilder.DropColumn(
                name: "ReviewerName",
                table: "SessionRatings");

            migrationBuilder.DropColumn(
                name: "SkillName",
                table: "SessionRatings");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ReviewerAvatarUrl",
                table: "SessionRatings",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReviewerName",
                table: "SessionRatings",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SkillName",
                table: "SessionRatings",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);
        }
    }
}
