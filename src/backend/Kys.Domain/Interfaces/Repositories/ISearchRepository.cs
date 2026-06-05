namespace Kys.Domain.Interfaces.Repositories;

public interface ISearchRepository
{
    Task<IReadOnlyList<SearchResult>> SearchCustomersAsync(string query, int limit, CancellationToken ct = default);
    Task<IReadOnlyList<SearchResult>> SearchProductsAsync(string query, int limit, CancellationToken ct = default);
    Task<IReadOnlyList<SearchResult>> SearchPeopleAsync(string query, int limit, CancellationToken ct = default);
    Task<IReadOnlyList<SearchResult>> SearchTeamsAsync(string query, int limit, CancellationToken ct = default);
    Task<IReadOnlyList<SearchResult>> SearchKbArticlesAsync(string query, int limit, CancellationToken ct = default);
}

public sealed record SearchResult(
    Guid Id,
    string Name,
    string? SubTitle,
    string? Status);
