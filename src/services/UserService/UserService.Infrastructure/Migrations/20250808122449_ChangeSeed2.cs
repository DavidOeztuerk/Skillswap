using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace UserService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ChangeSeed2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: "3446900b-96ca-4065-bc02-ff7c3455f97a");

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: "47a7f0da-0d03-4830-a66c-d9d2a9f7f3cf");

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: "4e1b9ccd-502e-4daa-9981-16446174b16c");

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: "7b5d314b-594f-4f1d-94a8-facc76ed9764");

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: "10721f3d-802f-428a-a030-e3390a7882de");

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: "22568257-bec1-4500-9401-27ea1481401d");

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: "94aee1be-e788-41bc-9681-f80961637d97");

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: "dc3e5412-817c-462a-bc34-3658a087d6ec");

            migrationBuilder.InsertData(
                table: "Permissions",
                columns: new[] { "Id", "Category", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "Description", "IsActive", "IsSystemPermission", "Name", "Resource", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { "660e8400-e29b-41d4-a716-446655440001", "Users", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, "View users", true, true, "users.view", "", null, null },
                    { "660e8400-e29b-41d4-a716-446655440002", "Users", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, "Manage users", true, true, "users.manage", "", null, null },
                    { "660e8400-e29b-41d4-a716-446655440003", "Skills", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, "View skills", true, true, "skills.view", "", null, null },
                    { "660e8400-e29b-41d4-a716-446655440004", "Skills", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, "Manage skills", true, true, "skills.manage", "", null, null }
                });

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "Description", "IsActive", "IsSystemRole", "Name", "ParentRoleId", "Priority", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { "550e8400-e29b-41d4-a716-446655440001", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, "Super Administrator with all permissions", true, true, "SuperAdmin", null, 1000, null, null },
                    { "550e8400-e29b-41d4-a716-446655440002", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, "Administrator with administrative permissions", true, true, "Admin", null, 900, null, null },
                    { "550e8400-e29b-41d4-a716-446655440003", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, "Moderator with content moderation permissions", true, true, "Moderator", null, 500, null, null },
                    { "550e8400-e29b-41d4-a716-446655440004", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, "Standard user with basic permissions", true, true, "User", null, 100, null, null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: "660e8400-e29b-41d4-a716-446655440001");

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: "660e8400-e29b-41d4-a716-446655440002");

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: "660e8400-e29b-41d4-a716-446655440003");

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: "660e8400-e29b-41d4-a716-446655440004");

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: "550e8400-e29b-41d4-a716-446655440001");

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: "550e8400-e29b-41d4-a716-446655440002");

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: "550e8400-e29b-41d4-a716-446655440003");

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: "550e8400-e29b-41d4-a716-446655440004");

            migrationBuilder.InsertData(
                table: "Permissions",
                columns: new[] { "Id", "Category", "CreatedBy", "DeletedAt", "DeletedBy", "Description", "IsActive", "IsSystemPermission", "Name", "Resource", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { "3446900b-96ca-4065-bc02-ff7c3455f97a", "Skills", null, null, null, "View skills", true, true, "skills.view", "", null, null },
                    { "47a7f0da-0d03-4830-a66c-d9d2a9f7f3cf", "Skills", null, null, null, "Manage skills", true, true, "skills.manage", "", null, null },
                    { "4e1b9ccd-502e-4daa-9981-16446174b16c", "Users", null, null, null, "Manage users", true, true, "users.manage", "", null, null },
                    { "7b5d314b-594f-4f1d-94a8-facc76ed9764", "Users", null, null, null, "View users", true, true, "users.view", "", null, null }
                });

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "CreatedBy", "DeletedAt", "DeletedBy", "Description", "IsActive", "IsSystemRole", "Name", "ParentRoleId", "Priority", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { "10721f3d-802f-428a-a030-e3390a7882de", null, null, null, "Super Administrator with all permissions", true, true, "SuperAdmin", null, 1000, null, null },
                    { "22568257-bec1-4500-9401-27ea1481401d", null, null, null, "Administrator with administrative permissions", true, true, "Admin", null, 900, null, null },
                    { "94aee1be-e788-41bc-9681-f80961637d97", null, null, null, "Moderator with content moderation permissions", true, true, "Moderator", null, 500, null, null },
                    { "dc3e5412-817c-462a-bc34-3658a087d6ec", null, null, null, "Standard user with basic permissions", true, true, "User", null, 100, null, null }
                });
        }
    }
}
