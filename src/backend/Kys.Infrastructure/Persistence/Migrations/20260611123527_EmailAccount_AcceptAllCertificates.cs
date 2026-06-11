using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kys.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EmailAccount_AcceptAllCertificates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "accept_all_certificates",
                table: "email_accounts",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "accept_all_certificates",
                table: "email_accounts");
        }
    }
}
