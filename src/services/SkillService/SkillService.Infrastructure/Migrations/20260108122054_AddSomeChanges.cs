using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkillService.Migrations
{
    /// <inheritdoc />
    public partial class AddSomeChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Skills_ProficiencyLevels_ProficiencyLevelId",
                table: "Skills");

            migrationBuilder.DropForeignKey(
                name: "FK_Skills_SkillCategories_SkillCategoryId",
                table: "Skills");

            migrationBuilder.DropTable(
                name: "ProficiencyLevels");

            migrationBuilder.DropIndex(
                name: "IX_Skills_ProficiencyLevelId",
                table: "Skills");

            migrationBuilder.DropColumn(
                name: "ProficiencyLevelId",
                table: "Skills");

            migrationBuilder.RenameColumn(
                name: "SkillCategoryId",
                table: "Skills",
                newName: "SkillTopicId");

            migrationBuilder.RenameColumn(
                name: "DesiredSkillCategoryId",
                table: "Skills",
                newName: "DesiredSkillTopicId");

            migrationBuilder.RenameIndex(
                name: "IX_Skills_SkillCategoryId",
                table: "Skills",
                newName: "IX_Skills_SkillTopicId");

            migrationBuilder.AddColumn<int>(
                name: "DisplayOrder",
                table: "SkillCategories",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "SkillPreferredDays",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    SkillId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    DayOfWeek = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
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
                    table.PrimaryKey("PK_SkillPreferredDays", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SkillPreferredDays_Skills_SkillId",
                        column: x => x.SkillId,
                        principalTable: "Skills",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SkillPreferredTimes",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    SkillId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    TimeSlot = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    StartTime = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    EndTime = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
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
                    table.PrimaryKey("PK_SkillPreferredTimes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SkillPreferredTimes_Skills_SkillId",
                        column: x => x.SkillId,
                        principalTable: "Skills",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SkillSubcategories",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    SkillCategoryId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IconName = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    Slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
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
                    table.PrimaryKey("PK_SkillSubcategories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SkillSubcategories_SkillCategories_SkillCategoryId",
                        column: x => x.SkillCategoryId,
                        principalTable: "SkillCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SkillTags",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    SkillId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    Tag = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    NormalizedTag = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
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
                    table.PrimaryKey("PK_SkillTags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SkillTags_Skills_SkillId",
                        column: x => x.SkillId,
                        principalTable: "Skills",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SkillTopics",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    SkillSubcategoryId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IconName = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    IsFeatured = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    Slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Keywords = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
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
                    table.PrimaryKey("PK_SkillTopics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SkillTopics_SkillSubcategories_SkillSubcategoryId",
                        column: x => x.SkillSubcategoryId,
                        principalTable: "SkillSubcategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SkillCategories_DisplayOrder",
                table: "SkillCategories",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_SkillPreferredDays_SkillDay",
                table: "SkillPreferredDays",
                columns: new[] { "SkillId", "DayOfWeek" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SkillPreferredDays_SkillId",
                table: "SkillPreferredDays",
                column: "SkillId");

            migrationBuilder.CreateIndex(
                name: "IX_SkillPreferredTimes_SkillId",
                table: "SkillPreferredTimes",
                column: "SkillId");

            migrationBuilder.CreateIndex(
                name: "IX_SkillPreferredTimes_SkillTime",
                table: "SkillPreferredTimes",
                columns: new[] { "SkillId", "TimeSlot" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SkillSubcategories_Name",
                table: "SkillSubcategories",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_SkillSubcategories_SkillCategoryId",
                table: "SkillSubcategories",
                column: "SkillCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_SkillSubcategories_SkillCategoryId_DisplayOrder",
                table: "SkillSubcategories",
                columns: new[] { "SkillCategoryId", "DisplayOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_SkillSubcategories_SkillCategoryId_Name",
                table: "SkillSubcategories",
                columns: new[] { "SkillCategoryId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SkillSubcategories_Slug",
                table: "SkillSubcategories",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "IX_SkillTags_NormalizedTag",
                table: "SkillTags",
                column: "NormalizedTag");

            migrationBuilder.CreateIndex(
                name: "IX_SkillTags_SkillId",
                table: "SkillTags",
                column: "SkillId");

            migrationBuilder.CreateIndex(
                name: "IX_SkillTags_SkillTag",
                table: "SkillTags",
                columns: new[] { "SkillId", "NormalizedTag" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SkillTopics_IsFeatured",
                table: "SkillTopics",
                column: "IsFeatured");

            migrationBuilder.CreateIndex(
                name: "IX_SkillTopics_Name",
                table: "SkillTopics",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_SkillTopics_SkillSubcategoryId",
                table: "SkillTopics",
                column: "SkillSubcategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_SkillTopics_SkillSubcategoryId_DisplayOrder",
                table: "SkillTopics",
                columns: new[] { "SkillSubcategoryId", "DisplayOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_SkillTopics_SkillSubcategoryId_Name",
                table: "SkillTopics",
                columns: new[] { "SkillSubcategoryId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SkillTopics_Slug",
                table: "SkillTopics",
                column: "Slug");

            // ===== DATA MIGRATION =====
            // For each existing SkillCategory, create a default Subcategory and Topic
            // Then update Skills to point to the new Topic instead of the old Category
            migrationBuilder.Sql(@"
                -- Step 1: Create a default Subcategory for each existing Category
                INSERT INTO ""SkillSubcategories"" (""Id"", ""SkillCategoryId"", ""Name"", ""Description"", ""IconName"", ""IsActive"", ""DisplayOrder"", ""Slug"", ""CreatedAt"", ""IsDeleted"")
                SELECT
                    'sub-' || ""Id"",
                    ""Id"",
                    ""Name"",
                    ""Description"",
                    ""IconName"",
                    ""IsActive"",
                    0,
                    ""Slug"",
                    NOW(),
                    false
                FROM ""SkillCategories"";

                -- Step 2: Create a default Topic for each Subcategory (which maps to each Category)
                INSERT INTO ""SkillTopics"" (""Id"", ""SkillSubcategoryId"", ""Name"", ""Description"", ""IconName"", ""IsActive"", ""DisplayOrder"", ""IsFeatured"", ""Slug"", ""Keywords"", ""CreatedAt"", ""IsDeleted"")
                SELECT
                    'topic-' || sc.""Id"",
                    sc.""Id"",
                    sc.""Name"",
                    sc.""Description"",
                    sc.""IconName"",
                    sc.""IsActive"",
                    0,
                    false,
                    sc.""Slug"",
                    NULL,
                    NOW(),
                    false
                FROM ""SkillSubcategories"" sc;

                -- Step 3: Update Skills to point to the new Topics
                -- SkillTopicId currently contains old SkillCategoryId, we need to map it to the new Topic
                UPDATE ""Skills"" s
                SET ""SkillTopicId"" = 'topic-sub-' || s.""SkillTopicId""
                WHERE s.""SkillTopicId"" IS NOT NULL;

                -- Step 4: Handle DesiredSkillTopicId the same way
                UPDATE ""Skills"" s
                SET ""DesiredSkillTopicId"" = 'topic-sub-' || s.""DesiredSkillTopicId""
                WHERE s.""DesiredSkillTopicId"" IS NOT NULL;
            ");

            migrationBuilder.AddForeignKey(
                name: "FK_Skills_SkillTopics_SkillTopicId",
                table: "Skills",
                column: "SkillTopicId",
                principalTable: "SkillTopics",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Skills_SkillTopics_SkillTopicId",
                table: "Skills");

            migrationBuilder.DropTable(
                name: "SkillPreferredDays");

            migrationBuilder.DropTable(
                name: "SkillPreferredTimes");

            migrationBuilder.DropTable(
                name: "SkillTags");

            migrationBuilder.DropTable(
                name: "SkillTopics");

            migrationBuilder.DropTable(
                name: "SkillSubcategories");

            migrationBuilder.DropIndex(
                name: "IX_SkillCategories_DisplayOrder",
                table: "SkillCategories");

            migrationBuilder.DropColumn(
                name: "DisplayOrder",
                table: "SkillCategories");

            migrationBuilder.RenameColumn(
                name: "SkillTopicId",
                table: "Skills",
                newName: "SkillCategoryId");

            migrationBuilder.RenameColumn(
                name: "DesiredSkillTopicId",
                table: "Skills",
                newName: "DesiredSkillCategoryId");

            migrationBuilder.RenameIndex(
                name: "IX_Skills_SkillTopicId",
                table: "Skills",
                newName: "IX_Skills_SkillCategoryId");

            migrationBuilder.AddColumn<string>(
                name: "ProficiencyLevelId",
                table: "Skills",
                type: "character varying(450)",
                maxLength: 450,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "ProficiencyLevels",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    Level = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Rank = table.Column<int>(type: "integer", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProficiencyLevels", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Skills_ProficiencyLevelId",
                table: "Skills",
                column: "ProficiencyLevelId");

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

            migrationBuilder.AddForeignKey(
                name: "FK_Skills_ProficiencyLevels_ProficiencyLevelId",
                table: "Skills",
                column: "ProficiencyLevelId",
                principalTable: "ProficiencyLevels",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Skills_SkillCategories_SkillCategoryId",
                table: "Skills",
                column: "SkillCategoryId",
                principalTable: "SkillCategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
