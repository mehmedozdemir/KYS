using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.KnowledgeBase.Queries.GetArticleDetail;

public sealed class GetArticleDetailQueryHandler(IKbRepository repository)
    : IRequestHandler<GetArticleDetailQuery, ArticleDetailDto?>
{
    public async Task<ArticleDetailDto?> Handle(GetArticleDetailQuery request, CancellationToken ct)
    {
        var article = await repository.GetByIdAsync(request.Id, ct);
        if (article is null) return null;

        return new ArticleDetailDto(
            article.Id,
            article.Title,
            article.Content,
            article.Visibility.ToString(),
            article.ProductId,
            article.Product?.Name,
            article.CustomerId,
            article.Customer?.Name,
            article.TeamId,
            article.Team?.Name,
            article.ArticleTags.Select(t => t.KbTag.Name).ToList(),
            article.CreatedAt,
            article.CreatedBy,
            article.UpdatedAt,
            article.UpdatedBy);
    }
}
