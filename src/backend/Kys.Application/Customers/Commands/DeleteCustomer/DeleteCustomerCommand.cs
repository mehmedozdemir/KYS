using Kys.Domain.Authorization;
using MediatR;

namespace Kys.Application.Customers.Commands.DeleteCustomer;

public sealed record DeleteCustomerCommand(Guid Id) : IRequest, IScopedCommand
{
    public ScopeTarget ScopeTarget => new(ScopeKind.Customer, Id);
}
