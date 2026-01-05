using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppointmentService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReviewSections : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CommunicationComment",
                table: "SessionRatings",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CommunicationRating",
                table: "SessionRatings",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "KnowledgeComment",
                table: "SessionRatings",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "KnowledgeRating",
                table: "SessionRatings",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReliabilityComment",
                table: "SessionRatings",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReliabilityRating",
                table: "SessionRatings",
                type: "integer",
                nullable: true);

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
                name: "SkillId",
                table: "SessionRatings",
                type: "character varying(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SkillName",
                table: "SessionRatings",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TeachingComment",
                table: "SessionRatings",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TeachingRating",
                table: "SessionRatings",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CommunicationComment",
                table: "SessionRatings");

            migrationBuilder.DropColumn(
                name: "CommunicationRating",
                table: "SessionRatings");

            migrationBuilder.DropColumn(
                name: "KnowledgeComment",
                table: "SessionRatings");

            migrationBuilder.DropColumn(
                name: "KnowledgeRating",
                table: "SessionRatings");

            migrationBuilder.DropColumn(
                name: "ReliabilityComment",
                table: "SessionRatings");

            migrationBuilder.DropColumn(
                name: "ReliabilityRating",
                table: "SessionRatings");

            migrationBuilder.DropColumn(
                name: "ReviewerAvatarUrl",
                table: "SessionRatings");

            migrationBuilder.DropColumn(
                name: "ReviewerName",
                table: "SessionRatings");

            migrationBuilder.DropColumn(
                name: "SkillId",
                table: "SessionRatings");

            migrationBuilder.DropColumn(
                name: "SkillName",
                table: "SessionRatings");

            migrationBuilder.DropColumn(
                name: "TeachingComment",
                table: "SessionRatings");

            migrationBuilder.DropColumn(
                name: "TeachingRating",
                table: "SessionRatings");
        }
    }
}
