using Kys.Domain.Authorization;
using MediatR;

namespace Kys.Application.Products.Commands.DeleteProductResourceTemplate;

public sealed record DeleteProductResourceTemplateCommand(Guid ProductId, Guid TemplateId) : IRequest, IScopedCommand
{
    public ScopeTarget ScopeTarget => new(ScopeKind.Product, ProductId);
}
