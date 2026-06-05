using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.KnowledgeBase.Commands.DeleteArticle;

public sealed class DeleteArticleCommandHandler(
    IKbRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<DeleteArticleCommand>
{
    public async Task Handle(DeleteArticleCommand request, CancellationToken ct)
    {
        var article = await repository.GetByIdAsync(request.Id, ct)
            ?? throw new NotFoundException("KbArticle", request.Id);

        repository.Delete(article);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
