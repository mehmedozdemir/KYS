using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Products.Commands.UpdateProductResourceTemplate;

public sealed class UpdateProductResourceTemplateCommandHandler(
    IProductRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<UpdateProductResourceTemplateCommand>
{
    public async Task Handle(UpdateProductResourceTemplateCommand request, CancellationToken ct)
    {
        var template = await repository.GetResourceTemplateByIdAsync(request.TemplateId, ct)
            ?? throw new NotFoundException("ProductResourceTemplate", request.TemplateId);

        template.Name = request.Name;
        template.Description = request.Description;
        template.IsRequired = request.IsRequired;
        template.CanBeShared = request.CanBeShared;
        template.SortOrder = request.SortOrder;

        repository.UpdateResourceTemplate(template);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
