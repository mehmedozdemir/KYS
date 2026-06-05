using MediatR;

namespace Kys.Application.Search.Queries.GlobalSearch;

public sealed record GlobalSearchQuery(string Query, int MaxResultsPerCategory = 5)
    : IRequest<GlobalSearchResultDto>;

public sealed record GlobalSearchResultDto(
    IReadOnlyList<SearchResultItemDto> Customers,
    IReadOnlyList<SearchResultItemDto> Products,
    IReadOnlyList<SearchResultItemDto> People,
    IReadOnlyList<SearchResultItemDto> Teams,
    IReadOnlyList<SearchResultItemDto> Articles);

public sealed record SearchResultItemDto(
    Guid Id,
    string Name,
    string? SubTitle,
    string Category,
    string? Status);
