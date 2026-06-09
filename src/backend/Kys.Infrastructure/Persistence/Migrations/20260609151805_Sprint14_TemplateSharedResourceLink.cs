using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kys.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Sprint14_TemplateSharedResourceLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "shared_resource_id",
                table: "product_resource_templates",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_product_resource_templates_shared_resource_id",
                table: "product_resource_templates",
                column: "shared_resource_id");

            migrationBuilder.AddForeignKey(
                name: "fk_product_resource_templates_shared_resources_shared_resource",
                table: "product_resource_templates",
                column: "shared_resource_id",
                principalTable: "shared_resources",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_product_resource_templates_shared_resources_shared_resource",
                table: "product_resource_templates");

            migrationBuilder.DropIndex(
                name: "ix_product_resource_templates_shared_resource_id",
                table: "product_resource_templates");

            migrationBuilder.DropColumn(
                name: "shared_resource_id",
                table: "product_resource_templates");
        }
    }
}
