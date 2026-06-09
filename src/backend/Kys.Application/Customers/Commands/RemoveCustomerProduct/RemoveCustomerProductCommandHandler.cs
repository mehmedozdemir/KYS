using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Customers.Commands.RemoveCustomerProduct;

public sealed class RemoveCustomerProductCommandHandler(
    ICustomerRepository customerRepository,
    IEnvironmentRepository environmentRepository,
    IUnitOfWork unitOfWork) : IRequestHandler<RemoveCustomerProductCommand>
{
    public async Task Handle(RemoveCustomerProductCommand request, CancellationToken ct)
    {
        var customerProduct = await customerRepository.GetCustomerProductByIdAsync(request.CustomerProductId, ct)
            ?? throw new NotFoundException("CustomerProduct", request.CustomerProductId);

        var envCount = await environmentRepository.CountEnvironmentsByCustomerProductAsync(request.CustomerProductId, ct);
        if (envCount > 0)
            throw new ConflictException(
                $"Bu ürünün {envCount} ortamı bulunmaktadır. Önce ortamları kaldırın.");

        customerRepository.RemoveCustomerProduct(customerProduct);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
