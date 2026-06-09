using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.Products.Queries.GetProductDetail;

public sealed record GetProductDetailQuery(Guid Id) : IRequest<ProductDetailDto>;

public sealed record ProductDetailDto(
    Guid Id,
    string Name,
    string Code,
    string? Description,
    string? Version,
    ProductType ProductType,
    ProductStatus Status,
    Guid? PoPersonId,
    string? PoName,
    IReadOnlyList<string> TechStack,
    string? RepositoryUrl,
    string? DocumentationUrl,
    IReadOnlyList<ProductTeamDto> Teams,
    IReadOnlyList<ProductAssignmentDto> Assignments,
    IReadOnlyList<ProductEndpointDto> Endpoints,
    IReadOnlyList<ProductResourceTemplateDto> ResourceTemplates,
    Dictionary<string, object?> CustomFields
);

public sealed record ProductTeamDto(Guid TeamId, string TeamName, string? Role, DateOnly? Since);
public sealed record ProductAssignmentDto(Guid PersonId, string FullName, string? Responsibility, DateOnly? StartedAt, bool IsActive);
public sealed record ProductEndpointDto(Guid Id, string Name, EndpointType EndpointType, string? DefaultBaseUrl, string? SwaggerUrl, int SortOrder);
public sealed record ProductResourceTemplateDto(Guid Id, string Name, Guid ResourceTypeId, string ResourceTypeName, bool IsRequired, bool CanBeShared, int SortOrder, Guid? SharedResourceId, string? SharedResourceName);
