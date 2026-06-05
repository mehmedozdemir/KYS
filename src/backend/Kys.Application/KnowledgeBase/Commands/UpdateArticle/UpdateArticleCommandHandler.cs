using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.KnowledgeBase.Commands.UpdateArticle;

public sealed class UpdateArticleCommandHandler(
    IKbRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<UpdateArticleCommand>
{
    public async Task Handle(UpdateArticleCommand request, CancellationToken ct)
    {
        var article = await repository.GetByIdAsync(request.Id, ct)
            ?? throw new NotFoundException("KbArticle", request.Id);

        article.Title = request.Title;
        article.Content = request.Content;
        article.Visibility = request.Visibility;
        article.ProductId = request.ProductId;
        article.CustomerId = request.CustomerId;
        article.TeamId = request.TeamId;

        // Replace tags
        article.ArticleTags.Clear();

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

        repository.Update(article);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
