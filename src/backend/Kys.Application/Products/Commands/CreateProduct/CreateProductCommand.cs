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
    string? DocumentationUrl
) : IRequest<Guid>;
