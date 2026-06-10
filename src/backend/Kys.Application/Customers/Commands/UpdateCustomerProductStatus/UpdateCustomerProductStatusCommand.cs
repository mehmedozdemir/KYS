using Kys.Domain.Authorization;
using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.Customers.Commands.UpdateCustomerProductStatus;

public sealed record UpdateCustomerProductStatusCommand(
    Guid CustomerId,
    Guid ProductId,
    CustomerProductStatus NewStatus,
    DateOnly? GoLiveAt,
    DateOnly? DiscontinuedAt
) : IRequest, IScopedCommand
{
    public ScopeTarget ScopeTarget => new(ScopeKind.Customer, CustomerId);
}
