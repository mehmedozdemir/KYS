using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Products.Commands.DeleteProduct;

public sealed class DeleteProductCommandHandler(
    IProductRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<DeleteProductCommand>
{
    public async Task Handle(DeleteProductCommand request, CancellationToken ct)
    {
        var product = await repository.GetByIdAsync(request.Id, ct)
            ?? throw new NotFoundException("Product", request.Id);

        product.IsDeleted = true;
        product.DeletedAt = DateTime.UtcNow;

        repository.Update(product);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
