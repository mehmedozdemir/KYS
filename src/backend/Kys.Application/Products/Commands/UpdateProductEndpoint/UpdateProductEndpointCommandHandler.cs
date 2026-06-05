using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Products.Commands.UpdateProductEndpoint;

public sealed class UpdateProductEndpointCommandHandler(
    IProductRepository productRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<UpdateProductEndpointCommand>
{
    public async Task Handle(UpdateProductEndpointCommand request, CancellationToken cancellationToken)
    {
        var endpoint = await productRepository.GetEndpointByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(ProductEndpoint), request.Id);

        endpoint.Name = request.Name;
        endpoint.Description = request.Description;
        endpoint.SortOrder = request.SortOrder;
        endpoint.DefaultBaseUrl = request.DefaultBaseUrl;
        endpoint.SwaggerUrl = request.SwaggerUrl;
        endpoint.HealthCheckUrl = request.HealthCheckUrl;
        endpoint.DefaultAuthType = request.DefaultAuthType;

        productRepository.UpdateEndpoint(endpoint);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
