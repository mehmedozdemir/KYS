using Kys.Domain.Authorization;
using MediatR;

namespace Kys.Application.Products.Commands.RemoveTeamFromProduct;

public sealed record RemoveTeamFromProductCommand(Guid ProductId, Guid TeamId) : IRequest, IScopedCommand
{
    public ScopeTarget ScopeTarget => new(ScopeKind.Product, ProductId);
}
