using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kys.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AuditLogContext : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "context",
                table: "audit_logs",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "context",
                table: "audit_logs");
        }
    }
}
