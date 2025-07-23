using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkillService.Migrations
{
    /// <inheritdoc />
    public partial class Rating : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProficiencyLevels",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Level = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Rank = table.Column<int>(type: "integer", nullable: false),
                    Color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    MinExperienceMonths = table.Column<int>(type: "integer", nullable: true),
                    MaxExperienceMonths = table.Column<int>(type: "integer", nullable: true),
                    RequiredSkillCount = table.Column<int>(type: "integer", nullable: true),
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
                    table.PrimaryKey("PK_ProficiencyLevels", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SkillCategories",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IconName = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsFeatured = table.Column<bool>(type: "boolean", nullable: false),
                    Slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    MetaDescription = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    SkillCount = table.Column<int>(type: "integer", nullable: false),
                    ActiveSkillCount = table.Column<int>(type: "integer", nullable: false),
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
                    table.PrimaryKey("PK_SkillCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Skills",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    SkillCategoryId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    ProficiencyLevelId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    IsOffering = table.Column<bool>(type: "boolean", nullable: false),
                    Requirements = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    IsRemoteAvailable = table.Column<bool>(type: "boolean", nullable: false),
                    EstimatedDurationMinutes = table.Column<int>(type: "integer", nullable: true),
                    TagsJson = table.Column<string>(type: "text", nullable: true),
                    AverageRating = table.Column<double>(type: "double precision", nullable: true),
                    ReviewCount = table.Column<int>(type: "integer", nullable: false),
                    EndorsementCount = table.Column<int>(type: "integer", nullable: false),
                    ViewCount = table.Column<int>(type: "integer", nullable: false),
                    MatchCount = table.Column<int>(type: "integer", nullable: false),
                    LastViewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastMatchedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsFeatured = table.Column<bool>(type: "boolean", nullable: false),
                    IsVerified = table.Column<bool>(type: "boolean", nullable: false),
                    SearchKeywords = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SearchRelevanceScore = table.Column<double>(type: "double precision", nullable: false),
                    Tags = table.Column<List<string>>(type: "text[]", nullable: false),
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
                    table.PrimaryKey("PK_Skills", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Skills_ProficiencyLevels_ProficiencyLevelId",
                        column: x => x.ProficiencyLevelId,
                        principalTable: "ProficiencyLevels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Skills_SkillCategories_SkillCategoryId",
                        column: x => x.SkillCategoryId,
                        principalTable: "SkillCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SkillEndorsements",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    SkillId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    EndorserUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    EndorsedUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    Message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Relationship = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IsVisible = table.Column<bool>(type: "boolean", nullable: false),
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
                    table.PrimaryKey("PK_SkillEndorsements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SkillEndorsements_Skills_SkillId",
                        column: x => x.SkillId,
                        principalTable: "Skills",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SkillMatches",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    OfferedSkillId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    RequestedSkillId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    OfferingUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    RequestingUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AcceptedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CancellationReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CompatibilityScore = table.Column<double>(type: "double precision", nullable: false),
                    MatchReason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    SessionDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SessionDurationMinutes = table.Column<int>(type: "integer", nullable: true),
                    SessionType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
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
                    table.PrimaryKey("PK_SkillMatches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SkillMatches_Skills_OfferedSkillId",
                        column: x => x.OfferedSkillId,
                        principalTable: "Skills",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SkillMatches_Skills_RequestedSkillId",
                        column: x => x.RequestedSkillId,
                        principalTable: "Skills",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SkillReviews",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    SkillId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    ReviewerUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    ReviewedUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: false),
                    Comment = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    TagsJson = table.Column<string>(type: "text", nullable: true),
                    HelpfulVotes = table.Column<int>(type: "integer", nullable: false),
                    TotalVotes = table.Column<int>(type: "integer", nullable: false),
                    ReviewContext = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    IsVerified = table.Column<bool>(type: "boolean", nullable: false),
                    IsVisible = table.Column<bool>(type: "boolean", nullable: false),
                    Tags = table.Column<List<string>>(type: "text[]", nullable: false),
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
                    table.PrimaryKey("PK_SkillReviews", x => x.Id);
                    table.CheckConstraint("CK_SkillReview_Rating", "\"Rating\" >= 1 AND \"Rating\" <= 5");
                    table.ForeignKey(
                        name: "FK_SkillReviews_Skills_SkillId",
                        column: x => x.SkillId,
                        principalTable: "Skills",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SkillViews",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    SkillId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    ViewerUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Referrer = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ViewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ViewDurationSeconds = table.Column<int>(type: "integer", nullable: false),
                    ViewSource = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
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
                    table.PrimaryKey("PK_SkillViews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SkillViews_Skills_SkillId",
                        column: x => x.SkillId,
                        principalTable: "Skills",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProficiencyLevels_Level",
                table: "ProficiencyLevels",
                column: "Level",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProficiencyLevels_Rank",
                table: "ProficiencyLevels",
                column: "Rank",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SkillCategories_Name",
                table: "SkillCategories",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SkillCategories_Slug",
                table: "SkillCategories",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SkillCategories_SortOrder",
                table: "SkillCategories",
                column: "SortOrder");

            migrationBuilder.CreateIndex(
                name: "IX_SkillEndorsements_EndorsedUserId",
                table: "SkillEndorsements",
                column: "EndorsedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SkillEndorsements_EndorserUserId",
                table: "SkillEndorsements",
                column: "EndorserUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SkillEndorsements_SkillId",
                table: "SkillEndorsements",
                column: "SkillId");

            migrationBuilder.CreateIndex(
                name: "IX_SkillEndorsements_SkillId_EndorserUserId",
                table: "SkillEndorsements",
                columns: new[] { "SkillId", "EndorserUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SkillMatches_OfferedSkillId",
                table: "SkillMatches",
                column: "OfferedSkillId");

            migrationBuilder.CreateIndex(
                name: "IX_SkillMatches_OfferingUserId",
                table: "SkillMatches",
                column: "OfferingUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SkillMatches_RequestedSkillId",
                table: "SkillMatches",
                column: "RequestedSkillId");

            migrationBuilder.CreateIndex(
                name: "IX_SkillMatches_RequestingUserId",
                table: "SkillMatches",
                column: "RequestingUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SkillMatches_Status",
                table: "SkillMatches",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_SkillReviews_IsVisible",
                table: "SkillReviews",
                column: "IsVisible");

            migrationBuilder.CreateIndex(
                name: "IX_SkillReviews_Rating",
                table: "SkillReviews",
                column: "Rating");

            migrationBuilder.CreateIndex(
                name: "IX_SkillReviews_ReviewedUserId",
                table: "SkillReviews",
                column: "ReviewedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SkillReviews_ReviewerUserId",
                table: "SkillReviews",
                column: "ReviewerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SkillReviews_SkillId",
                table: "SkillReviews",
                column: "SkillId");

            migrationBuilder.CreateIndex(
                name: "IX_SkillReviews_SkillId_ReviewerUserId",
                table: "SkillReviews",
                columns: new[] { "SkillId", "ReviewerUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Skills_AverageRating",
                table: "Skills",
                column: "AverageRating");

            migrationBuilder.CreateIndex(
                name: "IX_Skills_IsActive",
                table: "Skills",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Skills_IsActive_AverageRating",
                table: "Skills",
                columns: new[] { "IsActive", "AverageRating" });

            migrationBuilder.CreateIndex(
                name: "IX_Skills_ProficiencyLevelId",
                table: "Skills",
                column: "ProficiencyLevelId");

            migrationBuilder.CreateIndex(
                name: "IX_Skills_SkillCategoryId",
                table: "Skills",
                column: "SkillCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Skills_UserId",
                table: "Skills",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SkillViews_SkillId",
                table: "SkillViews",
                column: "SkillId");

            migrationBuilder.CreateIndex(
                name: "IX_SkillViews_ViewedAt",
                table: "SkillViews",
                column: "ViewedAt");

            migrationBuilder.CreateIndex(
                name: "IX_SkillViews_ViewerUserId",
                table: "SkillViews",
                column: "ViewerUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SkillEndorsements");

            migrationBuilder.DropTable(
                name: "SkillMatches");

            migrationBuilder.DropTable(
                name: "SkillReviews");

            migrationBuilder.DropTable(
                name: "SkillViews");

            migrationBuilder.DropTable(
                name: "Skills");

            migrationBuilder.DropTable(
                name: "ProficiencyLevels");

            migrationBuilder.DropTable(
                name: "SkillCategories");
        }
    }
}
