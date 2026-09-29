using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kys.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class DeploymentTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "target_go_live_at",
                table: "customer_products",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "deployed_version",
                table: "customer_environments",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "target_go_live_at",
                table: "customer_products");

            migrationBuilder.DropColumn(
                name: "deployed_version",
                table: "customer_environments");
        }
    }
}
