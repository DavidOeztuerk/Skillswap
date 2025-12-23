using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UserService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSessionManagementAndTokenRotation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Browser",
                table: "UserSessions",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeviceFingerprint",
                table: "UserSessions",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ExpiresAt",
                table: "UserSessions",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "NOW() + INTERVAL '24 hours'");

            migrationBuilder.AddColumn<bool>(
                name: "IsRevoked",
                table: "UserSessions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Language",
                table: "UserSessions",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OperatingSystem",
                table: "UserSessions",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RevokedAt",
                table: "UserSessions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RevokedReason",
                table: "UserSessions",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ScreenResolution",
                table: "UserSessions",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TimeZone",
                table: "UserSessions",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsUsed",
                table: "RefreshTokens",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ReplacedByToken",
                table: "RefreshTokens",
                type: "character varying(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SessionId",
                table: "RefreshTokens",
                type: "character varying(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TokenFamilyId",
                table: "RefreshTokens",
                type: "character varying(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UsedAt",
                table: "RefreshTokens",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserSessions_ActiveSessions",
                table: "UserSessions",
                columns: new[] { "UserId", "IsActive", "ExpiresAt" });

            migrationBuilder.CreateIndex(
                name: "IX_UserSessions_DeviceFingerprint",
                table: "UserSessions",
                column: "DeviceFingerprint");

            migrationBuilder.CreateIndex(
                name: "IX_UserSessions_ExpiresAt",
                table: "UserSessions",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_UserSessions_IsRevoked",
                table: "UserSessions",
                column: "IsRevoked");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_IsUsed",
                table: "RefreshTokens",
                column: "IsUsed");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_SessionId",
                table: "RefreshTokens",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_TokenFamilyId",
                table: "RefreshTokens",
                column: "TokenFamilyId");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_Valid",
                table: "RefreshTokens",
                columns: new[] { "UserId", "IsRevoked", "IsUsed", "ExpiryDate" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserSessions_ActiveSessions",
                table: "UserSessions");

            migrationBuilder.DropIndex(
                name: "IX_UserSessions_DeviceFingerprint",
                table: "UserSessions");

            migrationBuilder.DropIndex(
                name: "IX_UserSessions_ExpiresAt",
                table: "UserSessions");

            migrationBuilder.DropIndex(
                name: "IX_UserSessions_IsRevoked",
                table: "UserSessions");

            migrationBuilder.DropIndex(
                name: "IX_RefreshTokens_IsUsed",
                table: "RefreshTokens");

            migrationBuilder.DropIndex(
                name: "IX_RefreshTokens_SessionId",
                table: "RefreshTokens");

            migrationBuilder.DropIndex(
                name: "IX_RefreshTokens_TokenFamilyId",
                table: "RefreshTokens");

            migrationBuilder.DropIndex(
                name: "IX_RefreshTokens_Valid",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "Browser",
                table: "UserSessions");

            migrationBuilder.DropColumn(
                name: "DeviceFingerprint",
                table: "UserSessions");

            migrationBuilder.DropColumn(
                name: "ExpiresAt",
                table: "UserSessions");

            migrationBuilder.DropColumn(
                name: "IsRevoked",
                table: "UserSessions");

            migrationBuilder.DropColumn(
                name: "Language",
                table: "UserSessions");

            migrationBuilder.DropColumn(
                name: "OperatingSystem",
                table: "UserSessions");

            migrationBuilder.DropColumn(
                name: "RevokedAt",
                table: "UserSessions");

            migrationBuilder.DropColumn(
                name: "RevokedReason",
                table: "UserSessions");

            migrationBuilder.DropColumn(
                name: "ScreenResolution",
                table: "UserSessions");

            migrationBuilder.DropColumn(
                name: "TimeZone",
                table: "UserSessions");

            migrationBuilder.DropColumn(
                name: "IsUsed",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "ReplacedByToken",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "SessionId",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "TokenFamilyId",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "UsedAt",
                table: "RefreshTokens");
        }
    }
}
