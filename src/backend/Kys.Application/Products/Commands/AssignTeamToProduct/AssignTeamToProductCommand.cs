using Kys.Domain.Authorization;
using MediatR;

namespace Kys.Application.Products.Commands.AssignTeamToProduct;

public sealed record AssignTeamToProductCommand(
    Guid ProductId,
    Guid TeamId,
    string? Role,
    DateOnly? Since
) : IRequest, IScopedCommand
{
    public ScopeTarget ScopeTarget => new(ScopeKind.Product, ProductId);
}
