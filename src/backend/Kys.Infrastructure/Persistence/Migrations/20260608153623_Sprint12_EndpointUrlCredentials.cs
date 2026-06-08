using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kys.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Sprint12_EndpointUrlCredentials : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "endpoint_url_id",
                table: "resource_credentials",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_resource_credentials_endpoint_url_id_field_key",
                table: "resource_credentials",
                columns: new[] { "endpoint_url_id", "field_key" },
                unique: true,
                filter: "endpoint_url_id IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "fk_resource_credentials_customer_environment_endpoints_endpoin",
                table: "resource_credentials",
                column: "endpoint_url_id",
                principalTable: "customer_environment_endpoints",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_resource_credentials_customer_environment_endpoints_endpoin",
                table: "resource_credentials");

            migrationBuilder.DropIndex(
                name: "ix_resource_credentials_endpoint_url_id_field_key",
                table: "resource_credentials");

            migrationBuilder.DropColumn(
                name: "endpoint_url_id",
                table: "resource_credentials");

        }
    }
}
