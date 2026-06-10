using Kys.Application.CustomFields;
using Kys.Domain.Authorization;
using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.Products.Commands.UpdateProduct;

public sealed record UpdateProductCommand(
    Guid Id,
    string Name,
    string? Description,
    string? Version,
    ProductStatus Status,
    Guid? PoPersonId,
    List<string>? TechStack,
    string? RepositoryUrl,
    string? DocumentationUrl,
    Dictionary<string, object?>? CustomFields = null
) : IRequest, IHasCustomFields, IScopedCommand
{
    CustomFieldEntityType IHasCustomFields.EntityType => CustomFieldEntityType.Product;
    Dictionary<string, object?> IHasCustomFields.CustomFields => CustomFields ?? [];
    public ScopeTarget ScopeTarget => new(ScopeKind.Product, Id);
}
