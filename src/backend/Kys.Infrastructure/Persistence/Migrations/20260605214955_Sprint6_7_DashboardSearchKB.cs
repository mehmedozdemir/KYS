using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kys.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Sprint6_7_DashboardSearchKB : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "kb_articles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    content = table.Column<string>(type: "text", nullable: false),
                    visibility = table.Column<int>(type: "integer", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: true),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: true),
                    team_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_kb_articles", x => x.id);
                    table.ForeignKey(
                        name: "fk_kb_articles_customers_customer_id",
                        column: x => x.customer_id,
                        principalTable: "customers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_kb_articles_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_kb_articles_teams_team_id",
                        column: x => x.team_id,
                        principalTable: "teams",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "kb_tags",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_kb_tags", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "kb_article_tags",
                columns: table => new
                {
                    kb_article_id = table.Column<Guid>(type: "uuid", nullable: false),
                    kb_tag_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_kb_article_tags", x => new { x.kb_article_id, x.kb_tag_id });
                    table.ForeignKey(
                        name: "fk_kb_article_tags_kb_articles_kb_article_id",
                        column: x => x.kb_article_id,
                        principalTable: "kb_articles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_kb_article_tags_kb_tags_kb_tag_id",
                        column: x => x.kb_tag_id,
                        principalTable: "kb_tags",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_kb_article_tags_kb_tag_id",
                table: "kb_article_tags",
                column: "kb_tag_id");

            migrationBuilder.CreateIndex(
                name: "ix_kb_articles_customer_id",
                table: "kb_articles",
                column: "customer_id");

            migrationBuilder.CreateIndex(
                name: "ix_kb_articles_product_id",
                table: "kb_articles",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "ix_kb_articles_team_id",
                table: "kb_articles",
                column: "team_id");

            migrationBuilder.CreateIndex(
                name: "ix_kb_articles_title",
                table: "kb_articles",
                column: "title");

            migrationBuilder.CreateIndex(
                name: "ix_kb_tags_slug",
                table: "kb_tags",
                column: "slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "kb_article_tags");

            migrationBuilder.DropTable(
                name: "kb_articles");

            migrationBuilder.DropTable(
                name: "kb_tags");
        }
    }
}
