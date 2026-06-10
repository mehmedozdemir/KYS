using Kys.Domain.Authorization;
using MediatR;

namespace Kys.Application.Products.Commands.UpdateProductResourceTemplate;

public sealed record UpdateProductResourceTemplateCommand(
    Guid ProductId,
    Guid TemplateId,
    string Name,
    string? Description,
    bool IsRequired,
    bool CanBeShared,
    int SortOrder
) : IRequest, IScopedCommand
{
    public ScopeTarget ScopeTarget => new(ScopeKind.Product, ProductId);
}
