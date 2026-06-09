using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Kys.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Sprint24_HostingPlatform : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "hosting_platform_id",
                table: "customer_environments",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "hosting_platforms",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    code = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    icon = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_hosting_platforms", x => x.id);
                });

            migrationBuilder.InsertData(
                table: "hosting_platforms",
                columns: new[] { "id", "category", "code", "color", "description", "icon", "is_active", "name", "sort_order" },
                values: new object[,]
                {
                    { new Guid("20000000-0000-0000-0000-000000000001"), "Konteyner", "K8S", "#326CE5", null, "pi-server", true, "Kubernetes", 1 },
                    { new Guid("20000000-0000-0000-0000-000000000002"), "Konteyner", "DOCKER", "#2496ED", null, "pi-box", true, "Docker / Compose", 2 },
                    { new Guid("20000000-0000-0000-0000-000000000003"), "Sunucu", "LINUX", "#F0AB00", null, "pi-server", true, "Linux Sunucu", 3 },
                    { new Guid("20000000-0000-0000-0000-000000000004"), "Sunucu", "WINDOWS", "#0078D6", null, "pi-microsoft", true, "Windows Sunucu", 4 },
                    { new Guid("20000000-0000-0000-0000-000000000005"), "Bulut", "AWS", "#FF9900", null, "pi-cloud", true, "AWS", 5 },
                    { new Guid("20000000-0000-0000-0000-000000000006"), "Bulut", "AZURE", "#0078D4", null, "pi-cloud", true, "Azure", 6 },
                    { new Guid("20000000-0000-0000-0000-000000000007"), "Bulut", "GCP", "#4285F4", null, "pi-cloud", true, "Google Cloud", 7 }
                });

            migrationBuilder.CreateIndex(
                name: "ix_customer_environments_hosting_platform_id",
                table: "customer_environments",
                column: "hosting_platform_id");

            migrationBuilder.CreateIndex(
                name: "ix_hosting_platforms_code",
                table: "hosting_platforms",
                column: "code",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_customer_environments_hosting_platforms_hosting_platform_id",
                table: "customer_environments",
                column: "hosting_platform_id",
                principalTable: "hosting_platforms",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_customer_environments_hosting_platforms_hosting_platform_id",
                table: "customer_environments");

            migrationBuilder.DropTable(
                name: "hosting_platforms");

            migrationBuilder.DropIndex(
                name: "ix_customer_environments_hosting_platform_id",
                table: "customer_environments");

            migrationBuilder.DropColumn(
                name: "hosting_platform_id",
                table: "customer_environments");
        }
    }
}
