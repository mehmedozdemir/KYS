using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;

namespace Kys.Application.Products.Commands.DeleteProductResourceTemplate;

public sealed class DeleteProductResourceTemplateCommandHandler(
    IProductRepository repository,
    IUnitOfWork unitOfWork,
    ILocalizer localizer) : IRequestHandler<DeleteProductResourceTemplateCommand>
{
    public async Task Handle(DeleteProductResourceTemplateCommand request, CancellationToken ct)
    {
        var template = await repository.GetResourceTemplateByIdAsync(request.TemplateId, ct)
            ?? throw new NotFoundException("ProductResourceTemplate", request.TemplateId);

        var usageCount = await repository.CountEnvironmentResourcesByTemplateAsync(request.TemplateId, ct);
        if (usageCount > 0)
            throw new ConflictException(localizer.Get("err.resourceTemplate.inUse", usageCount));

        repository.DeleteResourceTemplate(template);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
