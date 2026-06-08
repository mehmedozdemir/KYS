using Dapper;
using Kys.Domain.Interfaces.Repositories;
using Npgsql;

namespace Kys.Infrastructure.Persistence.Repositories;

public sealed class DashboardRepository(NpgsqlDataSource dataSource) : IDashboardRepository
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
}
