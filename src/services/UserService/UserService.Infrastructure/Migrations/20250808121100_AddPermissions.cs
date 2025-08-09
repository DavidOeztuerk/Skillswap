using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace UserService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPermissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RoleId",
                table: "UserRoles",
                type: "character varying(450)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Permissions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Resource = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false, defaultValue: ""),
                    IsSystemPermission = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
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
                    table.PrimaryKey("PK_Permissions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    IsSystemRole = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    Priority = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    ParentRoleId = table.Column<string>(type: "character varying(450)", nullable: true),
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
                    table.PrimaryKey("PK_Roles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Roles_Roles_ParentRoleId",
                        column: x => x.ParentRoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "UserPermissions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    UserId = table.Column<string>(type: "character varying(450)", nullable: false),
                    PermissionId = table.Column<string>(type: "character varying(450)", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    IsGranted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    GrantedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    GrantedBy = table.Column<string>(type: "character varying(450)", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RevokedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RevokedBy = table.Column<string>(type: "character varying(450)", nullable: true),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ResourceId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    Conditions = table.Column<string>(type: "text", nullable: true),
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
                    table.PrimaryKey("PK_UserPermissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserPermissions_Permissions_PermissionId",
                        column: x => x.PermissionId,
                        principalTable: "Permissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserPermissions_Users_GrantedBy",
                        column: x => x.GrantedBy,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_UserPermissions_Users_RevokedBy",
                        column: x => x.RevokedBy,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_UserPermissions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RolePermissions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    RoleId = table.Column<string>(type: "character varying(450)", nullable: false),
                    PermissionId = table.Column<string>(type: "character varying(450)", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    GrantedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    GrantedBy = table.Column<string>(type: "character varying(450)", nullable: true),
                    RevokedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RevokedBy = table.Column<string>(type: "character varying(450)", nullable: true),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
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
                    table.PrimaryKey("PK_RolePermissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RolePermissions_Permissions_PermissionId",
                        column: x => x.PermissionId,
                        principalTable: "Permissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RolePermissions_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RolePermissions_Users_GrantedBy",
                        column: x => x.GrantedBy,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_RolePermissions_Users_RevokedBy",
                        column: x => x.RevokedBy,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.InsertData(
                table: "Permissions",
                columns: new[] { "Id", "Category", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "Description", "IsActive", "IsSystemPermission", "Name", "Resource", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { "0452d62a-8c95-4377-8832-984164aca656", "Users", new DateTime(2025, 8, 8, 12, 10, 59, 763, DateTimeKind.Utc).AddTicks(2577), null, null, null, "Manage users", true, true, "users.manage", "", null, null },
                    { "4ff0ac95-85d9-4022-bdc9-e77328f7b9a1", "Users", new DateTime(2025, 8, 8, 12, 10, 59, 763, DateTimeKind.Utc).AddTicks(1894), null, null, null, "View users", true, true, "users.view", "", null, null },
                    { "7a298007-1c36-4464-b5b5-0ea7825e36af", "Skills", new DateTime(2025, 8, 8, 12, 10, 59, 763, DateTimeKind.Utc).AddTicks(2578), null, null, null, "View skills", true, true, "skills.view", "", null, null },
                    { "ad8cf965-6892-4261-94e1-4cd9c58c8092", "Skills", new DateTime(2025, 8, 8, 12, 10, 59, 763, DateTimeKind.Utc).AddTicks(2579), null, null, null, "Manage skills", true, true, "skills.manage", "", null, null }
                });

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "Description", "IsActive", "IsSystemRole", "Name", "ParentRoleId", "Priority", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { "37ea9264-32fc-4af8-84a5-0a26e0941289", new DateTime(2025, 8, 8, 12, 10, 59, 762, DateTimeKind.Utc).AddTicks(6686), null, null, null, "Administrator with administrative permissions", true, true, "Admin", null, 900, null, null },
                    { "5c02d66e-1d88-47bf-b248-242c8520402e", new DateTime(2025, 8, 8, 12, 10, 59, 762, DateTimeKind.Utc).AddTicks(7261), null, null, null, "Standard user with basic permissions", true, true, "User", null, 100, null, null },
                    { "c103af16-0202-46c2-8609-d28fd0298a7b", new DateTime(2025, 8, 8, 12, 10, 59, 762, DateTimeKind.Utc).AddTicks(5816), null, null, null, "Super Administrator with all permissions", true, true, "SuperAdmin", null, 1000, null, null },
                    { "f9c24330-555f-469d-a27d-b8be334556cf", new DateTime(2025, 8, 8, 12, 10, 59, 762, DateTimeKind.Utc).AddTicks(7260), null, null, null, "Moderator with content moderation permissions", true, true, "Moderator", null, 500, null, null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserRoles_RoleId",
                table: "UserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_Permissions_Category",
                table: "Permissions",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_Permissions_Category_Name",
                table: "Permissions",
                columns: new[] { "Category", "Name" });

            migrationBuilder.CreateIndex(
                name: "IX_Permissions_IsActive",
                table: "Permissions",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Permissions_Name",
                table: "Permissions",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RolePermissions_GrantedAt",
                table: "RolePermissions",
                column: "GrantedAt");

            migrationBuilder.CreateIndex(
                name: "IX_RolePermissions_GrantedBy",
                table: "RolePermissions",
                column: "GrantedBy");

            migrationBuilder.CreateIndex(
                name: "IX_RolePermissions_IsActive",
                table: "RolePermissions",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_RolePermissions_PermissionId",
                table: "RolePermissions",
                column: "PermissionId");

            migrationBuilder.CreateIndex(
                name: "IX_RolePermissions_RevokedBy",
                table: "RolePermissions",
                column: "RevokedBy");

            migrationBuilder.CreateIndex(
                name: "IX_RolePermissions_RoleId_PermissionId",
                table: "RolePermissions",
                columns: new[] { "RoleId", "PermissionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Roles_IsActive",
                table: "Roles",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Roles_Name",
                table: "Roles",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Roles_ParentRoleId",
                table: "Roles",
                column: "ParentRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_Roles_Priority",
                table: "Roles",
                column: "Priority");

            migrationBuilder.CreateIndex(
                name: "IX_UserPermissions_ExpiresAt",
                table: "UserPermissions",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_UserPermissions_GrantedBy",
                table: "UserPermissions",
                column: "GrantedBy");

            migrationBuilder.CreateIndex(
                name: "IX_UserPermissions_IsActive",
                table: "UserPermissions",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_UserPermissions_PermissionId",
                table: "UserPermissions",
                column: "PermissionId");

            migrationBuilder.CreateIndex(
                name: "IX_UserPermissions_ResourceId",
                table: "UserPermissions",
                column: "ResourceId");

            migrationBuilder.CreateIndex(
                name: "IX_UserPermissions_RevokedBy",
                table: "UserPermissions",
                column: "RevokedBy");

            migrationBuilder.CreateIndex(
                name: "IX_UserPermissions_UserId_PermissionId_ResourceId",
                table: "UserPermissions",
                columns: new[] { "UserId", "PermissionId", "ResourceId" });

            migrationBuilder.AddForeignKey(
                name: "FK_UserRoles_Roles_RoleId",
                table: "UserRoles",
                column: "RoleId",
                principalTable: "Roles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserRoles_Roles_RoleId",
                table: "UserRoles");

            migrationBuilder.DropTable(
                name: "RolePermissions");

            migrationBuilder.DropTable(
                name: "UserPermissions");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropTable(
                name: "Permissions");

            migrationBuilder.DropIndex(
                name: "IX_UserRoles_RoleId",
                table: "UserRoles");

            migrationBuilder.DropColumn(
                name: "RoleId",
                table: "UserRoles");
        }
    }
}
