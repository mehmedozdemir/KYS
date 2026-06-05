using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.Customers.Queries.GetCustomers;

public sealed record GetCustomersQuery(
    string? Search,
    CustomerStatus? Status,
    bool IncludeArchived = false,
    int Page = 1,
    int PageSize = 20
) : IRequest<GetCustomersResult>;

public sealed record GetCustomersResult(IReadOnlyList<CustomerListDto> Items, int TotalCount, int Page, int PageSize);

public sealed record CustomerListDto(
    Guid Id,
    string Name,
    string Code,
    string? ShortName,
    CustomerStatus Status,
    bool IsArchived,
    DateOnly? ProductionLiveAt,
    int ProductCount
);
