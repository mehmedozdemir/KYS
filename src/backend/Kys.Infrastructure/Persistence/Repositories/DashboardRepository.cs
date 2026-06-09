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
}
