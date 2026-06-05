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
    string? DocumentationUrl
) : IRequest;
