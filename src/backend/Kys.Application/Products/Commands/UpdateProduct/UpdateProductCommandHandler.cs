using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Products.Commands.UpdateProduct;

public sealed class UpdateProductCommandHandler(
    IProductRepository productRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<UpdateProductCommand>
{
    public async Task Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        var product = await productRepository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Product), request.Id);

        product.Name = request.Name;
        product.Description = request.Description;
        product.Version = request.Version;
        product.Status = request.Status;
        product.PoPersonId = request.PoPersonId;
        product.TechStack = request.TechStack ?? [];
        product.RepositoryUrl = request.RepositoryUrl;
        product.DocumentationUrl = request.DocumentationUrl;
        product.CustomFields = request.CustomFields ?? [];

        productRepository.Update(product);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
