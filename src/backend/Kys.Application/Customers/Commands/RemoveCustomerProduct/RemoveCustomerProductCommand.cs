using Kys.Domain.Authorization;
using MediatR;

namespace Kys.Application.Customers.Commands.RemoveCustomerProduct;

public sealed record RemoveCustomerProductCommand(Guid CustomerProductId) : IRequest, IScopedCommand
{
    public ScopeTarget ScopeTarget => new(ScopeKind.CustomerProduct, CustomerProductId);
}
