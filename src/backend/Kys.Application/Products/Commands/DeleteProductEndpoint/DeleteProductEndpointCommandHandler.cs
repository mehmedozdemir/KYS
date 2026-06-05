using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Products.Commands.DeleteProductEndpoint;

public sealed class DeleteProductEndpointCommandHandler(
    IProductRepository productRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<DeleteProductEndpointCommand>
{
    public async Task Handle(DeleteProductEndpointCommand request, CancellationToken cancellationToken)
    {
        var endpoint = await productRepository.GetEndpointByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(ProductEndpoint), request.Id);

        productRepository.DeleteEndpoint(endpoint);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
