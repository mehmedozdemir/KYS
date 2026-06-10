using Kys.Domain.Authorization;
using MediatR;

namespace Kys.Application.Customers.Commands.RestoreCustomer;

public sealed record RestoreCustomerCommand(Guid Id) : IRequest, IScopedCommand
{
    public ScopeTarget ScopeTarget => new(ScopeKind.Customer, Id);
}
