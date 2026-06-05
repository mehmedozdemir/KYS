using Kys.Domain.Entities;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.KnowledgeBase.Commands.CreateArticle;

public sealed class CreateArticleCommandHandler(
    IKbRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<CreateArticleCommand, Guid>
{
    public async Task<Guid> Handle(CreateArticleCommand request, CancellationToken ct)
    {
        var article = new KbArticle
        {
            Title = request.Title,
            Content = request.Content,
            Visibility = request.Visibility,
            ProductId = request.ProductId,
            CustomerId = request.CustomerId,
            TeamId = request.TeamId
        };

        foreach (var tagName in request.Tags.Where(t => !string.IsNullOrWhiteSpace(t)).Distinct())
        {
            var slug = tagName.Trim().ToLowerInvariant().Replace(' ', '-');
            var tag = await repository.GetTagBySlugAsync(slug, ct);

            if (tag is null)
            {
                tag = new KbTag { Name = tagName.Trim(), Slug = slug };
                await repository.AddTagAsync(tag, ct);
            }

            article.ArticleTags.Add(new KbArticleTag { KbArticle = article, KbTag = tag });
        }

        await repository.AddAsync(article, ct);
        await unitOfWork.SaveChangesAsync(ct);
        return article.Id;
    }
}
