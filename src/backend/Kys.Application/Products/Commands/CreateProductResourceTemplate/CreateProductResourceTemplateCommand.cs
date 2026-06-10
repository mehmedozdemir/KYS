using Kys.Domain.Authorization;
using MediatR;

namespace Kys.Application.Products.Commands.CreateProductResourceTemplate;

public sealed record CreateProductResourceTemplateCommand(
    Guid ProductId,
    Guid ResourceTypeId,
    string Name,
    string? Description,
    bool IsRequired,
    bool CanBeShared,
    int SortOrder,
    Guid? SharedResourceId = null
) : IRequest<Guid>, IScopedCommand
{
    public ScopeTarget ScopeTarget => new(ScopeKind.Product, ProductId);
}
