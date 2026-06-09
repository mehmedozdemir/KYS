using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Customers.Queries.GetCustomers;

public sealed class GetCustomersQueryHandler(ICustomerRepository customerRepository)
    : IRequestHandler<GetCustomersQuery, GetCustomersResult>
{
    public async Task<GetCustomersResult> Handle(GetCustomersQuery request, CancellationToken cancellationToken)
    {
        var (items, total) = await customerRepository.GetAllAsync(
            request.Search, request.Status, request.IncludeArchived,
            request.Page, request.PageSize, cancellationToken);

        var dtos = items.Select(c => new CustomerListDto(
            c.Id, c.Name, c.Code, c.ShortName,
            c.Status, c.IsArchived, c.ProductionLiveAt,
            c.Products.Count,
            c.Products
                .OrderBy(cp => cp.Product.Code)
                .Select(cp => new CustomerProductBadgeDto(cp.Id, cp.ProductId, cp.Product.Code, cp.Product.Name))
                .ToList()
        )).ToList();

        return new GetCustomersResult(dtos, total, request.Page, request.PageSize);
    }
}
