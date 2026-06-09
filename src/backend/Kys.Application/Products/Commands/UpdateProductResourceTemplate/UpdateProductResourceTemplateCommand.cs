using MediatR;

namespace Kys.Application.Products.Commands.UpdateProductResourceTemplate;

public sealed record UpdateProductResourceTemplateCommand(
    Guid TemplateId,
    string Name,
    string? Description,
    bool IsRequired,
    bool CanBeShared,
    int SortOrder
) : IRequest;
