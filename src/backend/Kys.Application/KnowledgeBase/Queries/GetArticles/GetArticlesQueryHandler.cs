using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.KnowledgeBase.Queries.GetArticles;

public sealed class GetArticlesQueryHandler(IKbRepository repository)
    : IRequestHandler<GetArticlesQuery, ArticleListDto>
{
    public async Task<ArticleListDto> Handle(GetArticlesQuery request, CancellationToken ct)
    {
        var (items, total) = await repository.GetArticlesAsync(
            request.Search, request.ProductId, request.CustomerId, request.TeamId,
            request.Tag, request.Page, request.PageSize, ct);

        var dtos = items.Select(a => new ArticleSummaryDto(
            a.Id,
            a.Title,
            a.Visibility.ToString(),
            a.ProductId,
            a.Product?.Name,
            a.CustomerId,
            a.Customer?.Name,
            a.TeamId,
            a.Team?.Name,
            a.ArticleTags.Select(t => t.KbTag.Name).ToList(),
            a.UpdatedAt,
            a.UpdatedBy)).ToList();

        return new ArticleListDto(dtos, total, request.Page, request.PageSize);
    }
}
