using Kys.Domain.Entities;
using Kys.Domain.Enumerations;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Customers.Commands.AddProductToCustomer;

public sealed class AddProductToCustomerCommandHandler(
    ICustomerRepository customerRepository,
    IProductRepository productRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<AddProductToCustomerCommand, Guid>
{
    public async Task<Guid> Handle(AddProductToCustomerCommand request, CancellationToken cancellationToken)
    {
        _ = await customerRepository.GetByIdAsync(request.CustomerId, cancellationToken)
            ?? throw new NotFoundException(nameof(Customer), request.CustomerId);

        _ = await productRepository.GetByIdAsync(request.ProductId, cancellationToken)
            ?? throw new NotFoundException(nameof(Product), request.ProductId);

        var existing = await customerRepository.GetCustomerProductAsync(
            request.CustomerId, request.ProductId, cancellationToken);
        if (existing is not null)
            throw new DomainException("Ürün bu müşteriye zaten eklenmiş.");

        var customerProduct = new CustomerProduct
        {
            CustomerId = request.CustomerId,
            ProductId = request.ProductId,
            UsageMode = request.UsageMode,
            Notes = request.Notes
        };

        await customerRepository.AddCustomerProductAsync(customerProduct, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return customerProduct.Id;
    }
}
