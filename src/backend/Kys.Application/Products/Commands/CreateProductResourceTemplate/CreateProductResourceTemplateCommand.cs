using MediatR;

namespace Kys.Application.Products.Commands.CreateProductResourceTemplate;

public sealed record CreateProductResourceTemplateCommand(
    Guid ProductId,
    Guid ResourceTypeId,
    string Name,
    string? Description,
    bool IsRequired,
    bool CanBeShared,
    int SortOrder
) : IRequest<Guid>;
