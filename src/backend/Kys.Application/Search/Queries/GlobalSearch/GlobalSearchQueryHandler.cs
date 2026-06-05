using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Search.Queries.GlobalSearch;

public sealed class GlobalSearchQueryHandler(ISearchRepository repository)
    : IRequestHandler<GlobalSearchQuery, GlobalSearchResultDto>
{
    public async Task<GlobalSearchResultDto> Handle(GlobalSearchQuery request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Query) || request.Query.Length < 2)
            return new GlobalSearchResultDto([], [], [], [], []);

        var limit = request.MaxResultsPerCategory;

        var customers = await repository.SearchCustomersAsync(request.Query, limit, ct);
        var products = await repository.SearchProductsAsync(request.Query, limit, ct);
        var people = await repository.SearchPeopleAsync(request.Query, limit, ct);
        var teams = await repository.SearchTeamsAsync(request.Query, limit, ct);
        var articles = await repository.SearchKbArticlesAsync(request.Query, limit, ct);

        return new GlobalSearchResultDto(
            customers.Select(r => new SearchResultItemDto(r.Id, r.Name, r.SubTitle, "Customer", r.Status)).ToList(),
            products.Select(r => new SearchResultItemDto(r.Id, r.Name, r.SubTitle, "Product", r.Status)).ToList(),
            people.Select(r => new SearchResultItemDto(r.Id, r.Name, r.SubTitle, "Person", r.Status)).ToList(),
            teams.Select(r => new SearchResultItemDto(r.Id, r.Name, r.SubTitle, "Team", r.Status)).ToList(),
            articles.Select(r => new SearchResultItemDto(r.Id, r.Name, r.SubTitle, "Article", r.Status)).ToList());
    }
}
