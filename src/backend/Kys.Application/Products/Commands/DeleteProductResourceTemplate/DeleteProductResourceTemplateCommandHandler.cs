using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Products.Commands.DeleteProductResourceTemplate;

public sealed class DeleteProductResourceTemplateCommandHandler(
    IProductRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<DeleteProductResourceTemplateCommand>
{
    public async Task Handle(DeleteProductResourceTemplateCommand request, CancellationToken ct)
    {
        var template = await repository.GetResourceTemplateByIdAsync(request.TemplateId, ct)
            ?? throw new NotFoundException("ProductResourceTemplate", request.TemplateId);

        var usageCount = await repository.CountEnvironmentResourcesByTemplateAsync(request.TemplateId, ct);
        if (usageCount > 0)
            throw new ConflictException(
                $"Bu kaynak şablonu {usageCount} ortamda kullanılmaktadır. Önce ortamlardaki kaynakları kaldırın.");

        repository.DeleteResourceTemplate(template);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
