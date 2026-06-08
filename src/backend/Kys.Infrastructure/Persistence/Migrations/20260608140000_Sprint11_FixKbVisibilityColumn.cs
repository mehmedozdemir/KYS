using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kys.Infrastructure.Persistence.Migrations;

public partial class Sprint11_FixKbVisibilityColumn : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE kb_articles
            ALTER COLUMN visibility TYPE character varying(30)
            USING CASE visibility
                WHEN 0 THEN 'Internal'
                WHEN 1 THEN 'TeamOnly'
                WHEN 2 THEN 'Public'
                ELSE 'Internal'
            END;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE kb_articles
            ALTER COLUMN visibility TYPE integer
            USING CASE visibility
                WHEN 'Internal'  THEN 0
                WHEN 'TeamOnly'  THEN 1
                WHEN 'Public'    THEN 2
                ELSE 0
            END;
            """);
    }
}
