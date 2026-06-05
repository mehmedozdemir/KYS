using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Customers.Queries.GetCustomerDetail;

public sealed class GetCustomerDetailQueryHandler(ICustomerRepository customerRepository)
    : IRequestHandler<GetCustomerDetailQuery, CustomerDetailDto>
{
    public async Task<CustomerDetailDto> Handle(GetCustomerDetailQuery request, CancellationToken cancellationToken)
    {
        var customer = await customerRepository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Customer), request.Id);

        return new CustomerDetailDto(
            customer.Id, customer.Name, customer.Code, customer.ShortName,
            customer.Description, customer.Sector, customer.Country, customer.City,
            customer.Status, customer.IsArchived, customer.ArchivedAt,
            customer.OnboardingStartedAt, customer.TestEnvReadyAt,
            customer.ProdEnvReadyAt, customer.ProductionLiveAt,
            customer.ServiceEndedAt, customer.ChurnReason,
            customer.PrimaryContactName, customer.PrimaryContactEmail, customer.PrimaryContactPhone,
            customer.Products.Select(cp => new CustomerProductDto(
                cp.Id, cp.ProductId, cp.Product.Name, cp.Product.Code,
                cp.UsageMode, cp.Status, cp.GoLiveAt
            )).ToList(),
            customer.CustomFields
        );
    }
}
