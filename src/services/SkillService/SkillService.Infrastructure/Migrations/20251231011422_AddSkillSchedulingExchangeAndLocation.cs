using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkillService.Migrations
{
    /// <inheritdoc />
    public partial class AddSkillSchedulingExchangeAndLocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Tags",
                table: "Skills");

            migrationBuilder.AddColumn<string>(
                name: "Currency",
                table: "Skills",
                type: "character varying(3)",
                maxLength: 3,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DesiredSkillCategoryId",
                table: "Skills",
                type: "character varying(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DesiredSkillDescription",
                table: "Skills",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExchangeType",
                table: "Skills",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "skill_exchange");

            migrationBuilder.AddColumn<decimal>(
                name: "HourlyRate",
                table: "Skills",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LocationAddress",
                table: "Skills",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LocationCity",
                table: "Skills",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LocationCountry",
                table: "Skills",
                type: "character varying(2)",
                maxLength: 2,
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "LocationLatitude",
                table: "Skills",
                type: "double precision",
                precision: 9,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "LocationLongitude",
                table: "Skills",
                type: "double precision",
                precision: 9,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LocationPostalCode",
                table: "Skills",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LocationType",
                table: "Skills",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "remote");

            migrationBuilder.AddColumn<int>(
                name: "MaxDistanceKm",
                table: "Skills",
                type: "integer",
                nullable: false,
                defaultValue: 50);

            migrationBuilder.AddColumn<string>(
                name: "PreferredDaysJson",
                table: "Skills",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PreferredTimesJson",
                table: "Skills",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SessionDurationMinutes",
                table: "Skills",
                type: "integer",
                nullable: false,
                defaultValue: 60);

            migrationBuilder.AddColumn<int>(
                name: "TotalSessions",
                table: "Skills",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.CreateIndex(
                name: "IX_Skills_ExchangeType",
                table: "Skills",
                column: "ExchangeType");

            migrationBuilder.CreateIndex(
                name: "IX_Skills_Location",
                table: "Skills",
                columns: new[] { "LocationCity", "LocationCountry" });

            migrationBuilder.CreateIndex(
                name: "IX_Skills_LocationType",
                table: "Skills",
                column: "LocationType");

            migrationBuilder.CreateIndex(
                name: "IX_Skills_MatchingSearch",
                table: "Skills",
                columns: new[] { "IsActive", "IsOffered", "SkillCategoryId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Skills_ExchangeType",
                table: "Skills");

            migrationBuilder.DropIndex(
                name: "IX_Skills_Location",
                table: "Skills");

            migrationBuilder.DropIndex(
                name: "IX_Skills_LocationType",
                table: "Skills");

            migrationBuilder.DropIndex(
                name: "IX_Skills_MatchingSearch",
                table: "Skills");

            migrationBuilder.DropColumn(
                name: "Currency",
                table: "Skills");

            migrationBuilder.DropColumn(
                name: "DesiredSkillCategoryId",
                table: "Skills");

            migrationBuilder.DropColumn(
                name: "DesiredSkillDescription",
                table: "Skills");

            migrationBuilder.DropColumn(
                name: "ExchangeType",
                table: "Skills");

            migrationBuilder.DropColumn(
                name: "HourlyRate",
                table: "Skills");

            migrationBuilder.DropColumn(
                name: "LocationAddress",
                table: "Skills");

            migrationBuilder.DropColumn(
                name: "LocationCity",
                table: "Skills");

            migrationBuilder.DropColumn(
                name: "LocationCountry",
                table: "Skills");

            migrationBuilder.DropColumn(
                name: "LocationLatitude",
                table: "Skills");

            migrationBuilder.DropColumn(
                name: "LocationLongitude",
                table: "Skills");

            migrationBuilder.DropColumn(
                name: "LocationPostalCode",
                table: "Skills");

            migrationBuilder.DropColumn(
                name: "LocationType",
                table: "Skills");

            migrationBuilder.DropColumn(
                name: "MaxDistanceKm",
                table: "Skills");

            migrationBuilder.DropColumn(
                name: "PreferredDaysJson",
                table: "Skills");

            migrationBuilder.DropColumn(
                name: "PreferredTimesJson",
                table: "Skills");

            migrationBuilder.DropColumn(
                name: "SessionDurationMinutes",
                table: "Skills");

            migrationBuilder.DropColumn(
                name: "TotalSessions",
                table: "Skills");

            migrationBuilder.AddColumn<List<string>>(
                name: "Tags",
                table: "Skills",
                type: "text[]",
                nullable: false);
        }
    }
}
