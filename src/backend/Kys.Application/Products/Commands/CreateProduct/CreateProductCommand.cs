using Kys.Application.CustomFields;
using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.Products.Commands.CreateProduct;

public sealed record CreateProductCommand(
    string Name,
    string Code,
    string? Description,
    string? Version,
    ProductType ProductType,
    Guid? PoPersonId,
    List<string>? TechStack,
    string? RepositoryUrl,
    string? DocumentationUrl,
    Dictionary<string, object?>? CustomFields = null
) : IRequest<Guid>, IHasCustomFields
{
    CustomFieldEntityType IHasCustomFields.EntityType => CustomFieldEntityType.Product;
    Dictionary<string, object?> IHasCustomFields.CustomFields => CustomFields ?? [];
}
