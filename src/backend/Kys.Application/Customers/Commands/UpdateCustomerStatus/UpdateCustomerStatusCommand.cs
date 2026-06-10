using Kys.Domain.Authorization;
using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.Customers.Commands.UpdateCustomerStatus;

public sealed record UpdateCustomerStatusCommand(
    Guid Id,
    CustomerStatus NewStatus,
    DateOnly? ServiceEndedAt,
    string? ChurnReason
) : IRequest, IScopedCommand
{
    public ScopeTarget ScopeTarget => new(ScopeKind.Customer, Id);
}
