using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace UserService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ChangeSeed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: "0452d62a-8c95-4377-8832-984164aca656");

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: "4ff0ac95-85d9-4022-bdc9-e77328f7b9a1");

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: "7a298007-1c36-4464-b5b5-0ea7825e36af");

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: "ad8cf965-6892-4261-94e1-4cd9c58c8092");

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: "37ea9264-32fc-4af8-84a5-0a26e0941289");

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: "5c02d66e-1d88-47bf-b248-242c8520402e");

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: "c103af16-0202-46c2-8609-d28fd0298a7b");

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: "f9c24330-555f-469d-a27d-b8be334556cf");

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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
        }
    }
}
