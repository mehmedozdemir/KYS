using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kys.Persistence.Migrations
{
    /// <summary>
    /// Veri migration'ı: lifecycle tarihleri önceki sürümlerde hiç yazılmıyordu. Mevcut kayıtlar için
    /// yalnızca veriden kesin olarak türetilebilen tarihleri doldurur (müşteri/ortam oluşturma, ürün go-live).
    /// Mevcut değerlerin üzerine yazmaz.
    /// </summary>
    public partial class BackfillCustomerLifecycleDates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE customers
                SET onboarding_started_at = created_at::date
                WHERE onboarding_started_at IS NULL AND status <> 'Prospect';

                UPDATE customer_products cp
                SET installation_started_at = s.first_env,
                    test_ready_at = COALESCE(cp.test_ready_at, s.first_test),
                    prod_ready_at = COALESCE(cp.prod_ready_at, s.first_prod)
                FROM (
                    SELECT e.customer_product_id,
                           MIN(e.created_at)::date AS first_env,
                           MIN(e.created_at) FILTER (WHERE t.code <> 'PROD')::date AS first_test,
                           MIN(e.created_at) FILTER (WHERE t.code = 'PROD')::date AS first_prod
                    FROM customer_environments e
                    JOIN environment_types t ON t.id = e.environment_type_id
                    WHERE e.is_deleted = false
                    GROUP BY e.customer_product_id
                ) s
                WHERE cp.id = s.customer_product_id AND cp.installation_started_at IS NULL;

                UPDATE customers c
                SET test_env_ready_at = COALESCE(c.test_env_ready_at, s.first_test),
                    prod_env_ready_at = COALESCE(c.prod_env_ready_at, s.first_prod),
                    production_live_at = COALESCE(c.production_live_at, s.first_live)
                FROM (
                    SELECT cp.customer_id,
                           MIN(cp.test_ready_at) AS first_test,
                           MIN(cp.prod_ready_at) AS first_prod,
                           MIN(cp.go_live_at) AS first_live
                    FROM customer_products cp
                    WHERE cp.is_deleted = false
                    GROUP BY cp.customer_id
                ) s
                WHERE c.id = s.customer_id;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
