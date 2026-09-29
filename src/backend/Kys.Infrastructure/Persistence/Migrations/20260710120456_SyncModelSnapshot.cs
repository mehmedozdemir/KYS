using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kys.Infrastructure.Persistence.Migrations
{
    /// <summary>
    /// No-op migration. Sprint13_PersonalCredentials and Sprint14_CustomerVpnConfigs were
    /// hand-written without refreshing AppDbContextModelSnapshot, so EF reported permanent
    /// pending model changes and refused to migrate. This migration carries the regenerated
    /// snapshot only — the tables are still created by those two migrations.
    /// </summary>
    public partial class SyncModelSnapshot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
