using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kys.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SoftDeleteAwareUniqueIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_products_code",
                table: "products");

            migrationBuilder.DropIndex(
                name: "ix_kb_tags_slug",
                table: "kb_tags");

            migrationBuilder.DropIndex(
                name: "ix_customers_code",
                table: "customers");

            migrationBuilder.DropIndex(
                name: "ix_customer_products_customer_id_product_id",
                table: "customer_products");

            migrationBuilder.DropIndex(
                name: "ix_customer_environment_endpoints_customer_environment_id_prod",
                table: "customer_environment_endpoints");

            migrationBuilder.CreateIndex(
                name: "ix_products_code",
                table: "products",
                column: "code",
                unique: true,
                filter: "is_deleted = false");

            migrationBuilder.CreateIndex(
                name: "ix_kb_tags_slug",
                table: "kb_tags",
                column: "slug",
                unique: true,
                filter: "is_deleted = false");

            migrationBuilder.CreateIndex(
                name: "ix_customers_code",
                table: "customers",
                column: "code",
                unique: true,
                filter: "is_deleted = false");

            migrationBuilder.CreateIndex(
                name: "ix_customer_products_customer_id_product_id",
                table: "customer_products",
                columns: new[] { "customer_id", "product_id" },
                unique: true,
                filter: "is_deleted = false");

            migrationBuilder.CreateIndex(
                name: "ix_customer_environment_endpoints_customer_environment_id_prod",
                table: "customer_environment_endpoints",
                columns: new[] { "customer_environment_id", "product_endpoint_id" },
                unique: true,
                filter: "is_deleted = false");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_products_code",
                table: "products");

            migrationBuilder.DropIndex(
                name: "ix_kb_tags_slug",
                table: "kb_tags");

            migrationBuilder.DropIndex(
                name: "ix_customers_code",
                table: "customers");

            migrationBuilder.DropIndex(
                name: "ix_customer_products_customer_id_product_id",
                table: "customer_products");

            migrationBuilder.DropIndex(
                name: "ix_customer_environment_endpoints_customer_environment_id_prod",
                table: "customer_environment_endpoints");

            migrationBuilder.CreateIndex(
                name: "ix_products_code",
                table: "products",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_kb_tags_slug",
                table: "kb_tags",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_customers_code",
                table: "customers",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_customer_products_customer_id_product_id",
                table: "customer_products",
                columns: new[] { "customer_id", "product_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_customer_environment_endpoints_customer_environment_id_prod",
                table: "customer_environment_endpoints",
                columns: new[] { "customer_environment_id", "product_endpoint_id" },
                unique: true);
        }
    }
}
