using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Products.Commands.CreateProductEndpoint;

public sealed class CreateProductEndpointCommandHandler(
    IProductRepository productRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<CreateProductEndpointCommand, Guid>
{
    public async Task<Guid> Handle(CreateProductEndpointCommand request, CancellationToken cancellationToken)
    {
        _ = await productRepository.GetByIdAsync(request.ProductId, cancellationToken)
            ?? throw new NotFoundException(nameof(Product), request.ProductId);

        var endpoint = new ProductEndpoint
        {
            ProductId = request.ProductId,
            Name = request.Name,
            EndpointType = request.EndpointType,
            Description = request.Description,
            SortOrder = request.SortOrder,
            DefaultBaseUrl = request.DefaultBaseUrl,
            SwaggerUrl = request.SwaggerUrl,
            HealthCheckUrl = request.HealthCheckUrl,
            DefaultAuthType = request.DefaultAuthType
        };

        await productRepository.AddEndpointAsync(endpoint, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return endpoint.Id;
    }
}
