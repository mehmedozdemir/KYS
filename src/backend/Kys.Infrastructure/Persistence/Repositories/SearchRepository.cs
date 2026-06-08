using Dapper;
using Kys.Domain.Interfaces.Repositories;
using Npgsql;

namespace Kys.Infrastructure.Persistence.Repositories;

public sealed class SearchRepository(NpgsqlDataSource dataSource) : ISearchRepository
{
    public async Task<IReadOnlyList<SearchResult>> SearchCustomersAsync(string query, int limit, CancellationToken ct = default)
    {
        await using var conn = dataSource.CreateConnection();
        await conn.OpenAsync(ct);

        var results = await conn.QueryAsync<SearchResult>("""
            SELECT id, name, code AS sub_title, status
            FROM customers
            WHERE is_deleted = false
              AND is_archived = false
              AND (name ILIKE @Pattern OR code ILIKE @Pattern)
            ORDER BY name
            LIMIT @Limit
            """, new { Pattern = $"%{query}%", Limit = limit });

        return results.ToList();
    }

    public async Task<IReadOnlyList<SearchResult>> SearchProductsAsync(string query, int limit, CancellationToken ct = default)
    {
        await using var conn = dataSource.CreateConnection();
        await conn.OpenAsync(ct);

        var results = await conn.QueryAsync<SearchResult>("""
            SELECT id, name, code AS sub_title, status
            FROM products
            WHERE is_deleted = false
              AND (name ILIKE @Pattern OR code ILIKE @Pattern OR description ILIKE @Pattern)
            ORDER BY name
            LIMIT @Limit
            """, new { Pattern = $"%{query}%", Limit = limit });

        return results.ToList();
    }

    public async Task<IReadOnlyList<SearchResult>> SearchPeopleAsync(string query, int limit, CancellationToken ct = default)
    {
        await using var conn = dataSource.CreateConnection();
        await conn.OpenAsync(ct);

        var results = await conn.QueryAsync<SearchResult>("""
            SELECT
                id,
                CONCAT(first_name, ' ', last_name) AS name,
                title AS sub_title,
                employment_status AS status
            FROM people
            WHERE is_deleted = false
              AND (first_name ILIKE @Pattern OR last_name ILIKE @Pattern OR email ILIKE @Pattern OR title ILIKE @Pattern)
            ORDER BY last_name, first_name
            LIMIT @Limit
            """, new { Pattern = $"%{query}%", Limit = limit });

        return results.ToList();
    }

    public async Task<IReadOnlyList<SearchResult>> SearchTeamsAsync(string query, int limit, CancellationToken ct = default)
    {
        await using var conn = dataSource.CreateConnection();
        await conn.OpenAsync(ct);

        var results = await conn.QueryAsync<SearchResult>("""
            SELECT id, name, team_type AS sub_title, NULL AS status
            FROM teams
            WHERE is_deleted = false
              AND (name ILIKE @Pattern OR description ILIKE @Pattern)
            ORDER BY name
            LIMIT @Limit
            """, new { Pattern = $"%{query}%", Limit = limit });

        return results.ToList();
    }

    public async Task<IReadOnlyList<SearchResult>> SearchKbArticlesAsync(string query, int limit, CancellationToken ct = default)
    {
        await using var conn = dataSource.CreateConnection();
        await conn.OpenAsync(ct);

        var results = await conn.QueryAsync<SearchResult>("""
            SELECT id, title AS name, NULL AS sub_title, visibility AS status
            FROM kb_articles
            WHERE is_deleted = false
              AND (title ILIKE @Pattern OR content ILIKE @Pattern)
            ORDER BY updated_at DESC
            LIMIT @Limit
            """, new { Pattern = $"%{query}%", Limit = limit });

        return results.ToList();
    }
}
