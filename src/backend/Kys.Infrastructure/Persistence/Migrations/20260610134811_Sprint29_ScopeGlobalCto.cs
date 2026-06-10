using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kys.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Sprint29_ScopeGlobalCto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "system_roles",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000007"),
                column: "permissions",
                value: "[\"scope:global\",\"customer:read\",\"product:read\",\"team:read\",\"person:read\",\"environment:read\",\"kb:read\",\"admin:audit\"]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "system_roles",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000007"),
                column: "permissions",
                value: "[\"customer:read\",\"product:read\",\"team:read\",\"person:read\",\"environment:read\",\"kb:read\",\"admin:audit\"]");
        }
    }
}
