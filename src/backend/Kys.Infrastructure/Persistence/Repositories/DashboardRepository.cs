using Dapper;
using Kys.Domain.Entities;
using Kys.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Kys.Infrastructure.Persistence.Repositories;

public sealed class DashboardRepository(NpgsqlDataSource dataSource, AppDbContext db) : IDashboardRepository
{
    public async Task<DashboardStatsResult> GetStatsAsync(CancellationToken ct = default)
    {
        await using var conn = dataSource.CreateConnection();
        await conn.OpenAsync(ct);

        var result = await conn.QuerySingleAsync<DashboardStatsResult>("""
            SELECT
                COUNT(*) FILTER (WHERE c.status = 'Active'     AND c.is_deleted = false)::int AS active_customer_count,
                COUNT(*) FILTER (WHERE c.status = 'Onboarding' AND c.is_deleted = false)::int AS onboarding_customer_count,
                (SELECT COUNT(*) FROM products WHERE is_deleted = false)::int                 AS total_product_count,
                (SELECT COUNT(*) FROM products WHERE status = 'Active' AND is_deleted = false)::int AS active_product_count,
                (SELECT COUNT(*) FROM teams WHERE is_deleted = false)::int                    AS total_team_count,
                (SELECT COUNT(*) FROM people WHERE is_deleted = false)::int                   AS total_person_count,
                (SELECT COUNT(*) FROM people WHERE employment_status = 'Active' AND is_deleted = false)::int AS active_person_count
            FROM customers c
            """);

        return result;
    }

    public async Task<IReadOnlyList<RecentActivityResult>> GetRecentActivitiesAsync(int count, CancellationToken ct = default)
    {
        await using var conn = dataSource.CreateConnection();
        await conn.OpenAsync(ct);

        var results = await conn.QueryAsync<RecentActivityResult>("""
            SELECT
                al.id,
                al.entity_type,
                al.entity_id,
                al.entity_name,
                al.action,
                al.changed_by,
                CONCAT(p.first_name, ' ', p.last_name) AS changed_by_name,
                al.changed_at
            FROM audit_logs al
            LEFT JOIN people p ON p.id = al.changed_by AND p.is_deleted = false
            ORDER BY al.changed_at DESC
            LIMIT @Count
            """, new { Count = count });

        return results.ToList();
    }

    public async Task<IReadOnlyList<CustomerEnvironment>> GetWorkspaceEnvironmentsAsync(
        Guid personId, bool allCustomers, CancellationToken ct = default)
    {
        var query = db.CustomerEnvironments
            .AsNoTracking()
            .Where(e => e.IsActive && !e.CustomerProduct.Customer.IsArchived);

        if (!allCustomers)
        {
            var myProductIds = db.ProductAssignments
                .Where(pa => pa.PersonId == personId && pa.IsActive)
                .Select(pa => pa.ProductId)
                .Union(db.ProductTeams
                    .Where(pt => db.TeamMemberships.Any(tm =>
                        tm.TeamId == pt.TeamId && tm.PersonId == personId && tm.EndDate == null))
                    .Select(pt => pt.ProductId));

            query = query.Where(e => myProductIds.Contains(e.CustomerProduct.ProductId));
        }

        return await query
            .Include(e => e.EnvironmentType)
            .Include(e => e.HostingPlatform)
            .Include(e => e.CustomerProduct).ThenInclude(cp => cp.Customer)
            .Include(e => e.CustomerProduct).ThenInclude(cp => cp.Product)
            .Include(e => e.Resources).ThenInclude(r => r.ProductResourceTemplate).ThenInclude(t => t.ResourceType)
            .Include(e => e.Resources).ThenInclude(r => r.SharedResource)
            .Include(e => e.Resources).ThenInclude(r => r.Credentials)
            .Include(e => e.Endpoints).ThenInclude(ep => ep.ProductEndpoint)
            .Include(e => e.Endpoints).ThenInclude(ep => ep.Credentials)
            .OrderBy(e => e.CustomerProduct.Customer.Name)
            .ThenBy(e => e.CustomerProduct.Product.Name)
            .ThenBy(e => e.EnvironmentType.SortOrder)
            .ThenBy(e => e.Name)
            .AsSplitQuery()
            .ToListAsync(ct);
    }

    public async Task<ExecutiveSummaryResult> GetExecutiveSummaryAsync(CancellationToken ct = default)
    {
        await using var conn = dataSource.CreateConnection();
        await conn.OpenAsync(ct);

        var pipeline = await conn.QueryAsync<StatusCountResult>("""
            SELECT status, COUNT(*)::int AS count
            FROM customers WHERE is_deleted = false
            GROUP BY status
            """);

        var onboarding = await conn.QueryAsync<OnboardingCustomerResult>("""
            SELECT id, name, code, onboarding_started_at, test_env_ready_at, prod_env_ready_at
            FROM customers
            WHERE is_deleted = false AND status = 'Onboarding'
            ORDER BY onboarding_started_at NULLS LAST, name
            """);

        var goLives = await conn.QueryAsync<GoLiveResult>("""
            SELECT c.id AS customer_id, c.name AS customer_name, p.name AS product_name, cp.go_live_at
            FROM customer_products cp
            JOIN customers c ON c.id = cp.customer_id AND c.is_deleted = false
            JOIN products p ON p.id = cp.product_id
            WHERE cp.is_deleted = false AND cp.go_live_at >= current_date - INTERVAL '12 months'
            ORDER BY cp.go_live_at DESC
            LIMIT 10
            """);

        var adoption = await conn.QueryAsync<ProductAdoptionResult>("""
            SELECT p.id AS product_id, p.name, p.code,
                   COUNT(cp.id) FILTER (WHERE c.id IS NOT NULL AND NOT c.is_archived)::int AS customer_count,
                   COUNT(cp.id) FILTER (WHERE cp.status = 'Active' AND c.id IS NOT NULL AND NOT c.is_archived)::int AS live_count
            FROM products p
            LEFT JOIN customer_products cp ON cp.product_id = p.id AND cp.is_deleted = false
            LEFT JOIN customers c ON c.id = cp.customer_id AND c.is_deleted = false
            WHERE p.is_deleted = false
            GROUP BY p.id, p.name, p.code
            ORDER BY customer_count DESC, p.name
            """);

        // Müşteri özel alanlarından (tipi Date) önümüzdeki 12 ay içindeki tarihler — ör. sözleşme bitişi.
        // Alan anahtarları koda gömülmez; tanımlardan okunur. Geçersiz metinler cast edilmeden elenir.
        var upcoming = await conn.QueryAsync<UpcomingDateResult>("""
            SELECT customer_id, customer_name, field_name, value_date AS date
            FROM (
                SELECT c.id AS customer_id, c.name AS customer_name, d.display_name AS field_name,
                       CASE WHEN (c.custom_fields ->> d.field_key) ~ '^\d{4}-\d{2}-\d{2}'
                            THEN substring(c.custom_fields ->> d.field_key from 1 for 10)::date END AS value_date
                FROM customers c
                JOIN custom_field_definitions d ON d.entity_type = 'Customer' AND d.field_type = 'Date' AND d.is_active
                WHERE c.is_deleted = false AND NOT c.is_archived
            ) x
            WHERE value_date BETWEEN current_date AND current_date + INTERVAL '12 months'
            ORDER BY value_date
            LIMIT 10
            """);

        // Sayısal müşteri özel alanlarının (ör. yıllık sözleşme bedeli) aktif/devreye alınan müşterilerdeki toplamı
        var totals = await conn.QueryAsync<NumberTotalResult>("""
            SELECT d.display_name AS field_name,
                   COALESCE(SUM(CASE WHEN (c.custom_fields ->> d.field_key) ~ '^-?\d+(\.\d+)?$'
                                     THEN (c.custom_fields ->> d.field_key)::numeric END), 0) AS total,
                   COUNT(*) FILTER (WHERE (c.custom_fields ->> d.field_key) ~ '^-?\d+(\.\d+)?$')::int AS customer_count
            FROM custom_field_definitions d
            LEFT JOIN customers c ON c.is_deleted = false AND c.status IN ('Active', 'Onboarding')
            WHERE d.entity_type = 'Customer' AND d.field_type = 'Number' AND d.is_active
            GROUP BY d.display_name, d.display_order
            ORDER BY d.display_order
            """);

        var security = await conn.QuerySingleAsync<(int Reveals, int Changes)>("""
            SELECT
                COUNT(*) FILTER (WHERE action LIKE '%Revealed' AND changed_at >= now() - INTERVAL '30 days')::int,
                COUNT(*) FILTER (WHERE action IN ('Created', 'Updated', 'Deleted', 'Restored') AND changed_at >= now() - INTERVAL '7 days')::int
            FROM audit_logs
            """);

        return new ExecutiveSummaryResult(
            pipeline.ToList(),
            onboarding.ToList(),
            goLives.ToList(),
            adoption.ToList(),
            upcoming.ToList(),
            totals.ToList(),
            security.Reveals,
            security.Changes);
    }
}
