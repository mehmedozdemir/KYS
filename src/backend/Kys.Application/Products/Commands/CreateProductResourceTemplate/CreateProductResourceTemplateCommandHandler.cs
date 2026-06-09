using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Products.Commands.CreateProductResourceTemplate;

public sealed class CreateProductResourceTemplateCommandHandler(
    IProductRepository productRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<CreateProductResourceTemplateCommand, Guid>
{
    public async Task<Guid> Handle(CreateProductResourceTemplateCommand request, CancellationToken cancellationToken)
    {
        _ = await productRepository.GetByIdAsync(request.ProductId, cancellationToken)
            ?? throw new NotFoundException(nameof(Product), request.ProductId);

        var template = new ProductResourceTemplate
        {
            ProductId = request.ProductId,
            ResourceTypeId = request.ResourceTypeId,
            Name = request.Name,
            Description = request.Description,
            IsRequired = request.IsRequired,
            CanBeShared = request.CanBeShared,
            SortOrder = request.SortOrder,
            SharedResourceId = request.SharedResourceId
        };

        await productRepository.AddResourceTemplateAsync(template, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return template.Id;
    }
}
