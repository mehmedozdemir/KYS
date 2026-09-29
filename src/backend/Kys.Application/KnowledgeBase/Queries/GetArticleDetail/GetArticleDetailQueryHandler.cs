using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.KnowledgeBase.Queries.GetArticleDetail;

public sealed class GetArticleDetailQueryHandler(IKbRepository repository, IPersonRepository personRepository)
    : IRequestHandler<GetArticleDetailQuery, ArticleDetailDto?>
{
    public async Task<ArticleDetailDto?> Handle(GetArticleDetailQuery request, CancellationToken ct)
    {
        var article = await repository.GetByIdAsync(request.Id, ct);
        if (article is null) return null;

        // Yazar ve son düzenleyen adları (makalenin güvenilirliği için okuyucuya gösterilir)
        async Task<string?> NameOf(Guid? id) => id is { } pid ? (await personRepository.GetByIdAsync(pid, ct))?.FullName : null;
        var createdByName = await NameOf(article.CreatedBy);
        var updatedByName = article.UpdatedBy == article.CreatedBy ? createdByName : await NameOf(article.UpdatedBy);

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
            article.UpdatedBy,
            createdByName,
            updatedByName);
    }
}
