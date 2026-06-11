using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kys.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Sprint37_OrganizationProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "organization_profiles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    company_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    short_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    website = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    slogan = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    contact_email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    contact_phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    tax_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    logo_bytes = table.Column<byte[]>(type: "bytea", nullable: true),
                    logo_content_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    logo_updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_organization_profiles", x => x.id);
                });

            migrationBuilder.InsertData(
                table: "organization_profiles",
                columns: new[] { "id", "address", "company_name", "contact_email", "contact_phone", "logo_bytes", "logo_content_type", "logo_updated_at", "short_name", "slogan", "tax_number", "website" },
                values: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), null, "KYS", null, null, null, null, null, null, null, null, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "organization_profiles");
        }
    }
}
