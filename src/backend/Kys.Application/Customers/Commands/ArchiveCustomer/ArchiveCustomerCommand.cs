using Kys.Domain.Authorization;
using MediatR;

namespace Kys.Application.Customers.Commands.ArchiveCustomer;

public sealed record ArchiveCustomerCommand(Guid Id) : IRequest, IScopedCommand
{
    public ScopeTarget ScopeTarget => new(ScopeKind.Customer, Id);
}
