using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Products.Commands.RemovePersonFromProduct;

public sealed class RemovePersonFromProductCommandHandler(
    IProductRepository productRepository,
    IUnitOfWork unitOfWork) : IRequestHandler<RemovePersonFromProductCommand>
{
    public async Task Handle(RemovePersonFromProductCommand request, CancellationToken ct)
    {
        var assignment = await productRepository.GetPersonAssignmentAsync(request.ProductId, request.PersonId, ct)
            ?? throw new NotFoundException("ProductAssignment", request.PersonId);

        productRepository.RemovePersonAssignment(assignment);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
