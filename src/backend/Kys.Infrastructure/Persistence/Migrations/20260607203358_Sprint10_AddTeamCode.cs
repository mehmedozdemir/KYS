using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kys.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Sprint10_AddTeamCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "code",
                table: "teams",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "code",
                table: "teams");
        }
    }
}
