using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UserService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserReviews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserReviews",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    ReviewerId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    RevieweeId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    SessionId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    SkillId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    Rating = table.Column<int>(type: "integer", nullable: false),
                    ReviewText = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ReviewerName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ReviewerAvatarUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SkillName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserReviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserReviews_Users_RevieweeId",
                        column: x => x.RevieweeId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserReviews_Users_ReviewerId",
                        column: x => x.ReviewerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserReviews_CreatedAt",
                table: "UserReviews",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_UserReviews_Rating",
                table: "UserReviews",
                column: "Rating");

            migrationBuilder.CreateIndex(
                name: "IX_UserReviews_RevieweeId",
                table: "UserReviews",
                column: "RevieweeId");

            migrationBuilder.CreateIndex(
                name: "IX_UserReviews_RevieweeRating",
                table: "UserReviews",
                columns: new[] { "RevieweeId", "Rating" });

            migrationBuilder.CreateIndex(
                name: "IX_UserReviews_RevieweeRecent",
                table: "UserReviews",
                columns: new[] { "RevieweeId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_UserReviews_ReviewerId",
                table: "UserReviews",
                column: "ReviewerId");

            migrationBuilder.CreateIndex(
                name: "IX_UserReviews_SessionId",
                table: "UserReviews",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_UserReviews_SkillId",
                table: "UserReviews",
                column: "SkillId");

            migrationBuilder.CreateIndex(
                name: "IX_UserReviews_UniqueSessionReview",
                table: "UserReviews",
                columns: new[] { "ReviewerId", "SessionId" },
                unique: true,
                filter: "\"SessionId\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserReviews");
        }
    }
}
