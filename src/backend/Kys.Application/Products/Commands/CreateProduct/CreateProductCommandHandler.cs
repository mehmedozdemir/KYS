using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Products.Commands.CreateProduct;

public sealed class CreateProductCommandHandler(
    IProductRepository productRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<CreateProductCommand, Guid>
{
    public async Task<Guid> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        var product = new Product
        {
            Name = request.Name,
            Code = request.Code.ToUpperInvariant(),
            Description = request.Description,
            Version = request.Version,
            ProductType = request.ProductType,
            PoPersonId = request.PoPersonId,
            TechStack = request.TechStack ?? [],
            RepositoryUrl = request.RepositoryUrl,
            DocumentationUrl = request.DocumentationUrl,
            CustomFields = request.CustomFields ?? []
        };

        await productRepository.AddAsync(product, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return product.Id;
    }
}
