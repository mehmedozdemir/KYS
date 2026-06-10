using Kys.Domain.Authorization;
using MediatR;

namespace Kys.Application.Products.Commands.DeleteProductEndpoint;

public sealed record DeleteProductEndpointCommand(Guid ProductId, Guid Id) : IRequest, IScopedCommand
{
    public ScopeTarget ScopeTarget => new(ScopeKind.Product, ProductId);
}
