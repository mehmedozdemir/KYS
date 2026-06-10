using Kys.Domain.Authorization;
using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.Customers.Commands.AddProductToCustomer;

public sealed record AddProductToCustomerCommand(
    Guid CustomerId,
    Guid ProductId,
    UsageMode UsageMode,
    string? Notes
) : IRequest<Guid>, IScopedCommand
{
    public ScopeTarget ScopeTarget => new(ScopeKind.Customer, CustomerId);
}
