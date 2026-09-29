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

        var product = await productRepository.GetByIdAsync(request.ProductId, cancellationToken)
            ?? throw new NotFoundException(nameof(Product), request.ProductId);

        // Ürünün dağıtım modeli kullanım modunu belirler: SaaS ürün müşteriye özel kurulamaz,
        // müşteriye özel ürün paylaşımlı (SaaS) kullanılamaz. Hibrit ürün her ikisini destekler.
        var allowed = product.ProductType switch
        {
            ProductType.SaaS => request.UsageMode == UsageMode.SaaS,
            ProductType.CustomerBased => request.UsageMode == UsageMode.Dedicated,
            _ => true
        };
        if (!allowed)
            throw new DomainException("err.customer.usageModeNotAllowed");

        var existing = await customerRepository.GetCustomerProductAsync(
            request.CustomerId, request.ProductId, cancellationToken);
        if (existing is not null)
            throw new DomainException("err.customer.productAlreadyAdded");

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
