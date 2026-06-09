using MediatR;

namespace Kys.Application.Resources.Queries.GetSharedResources;

public sealed record GetSharedResourcesQuery(string? Scope = null)
    : IRequest<IReadOnlyList<SharedResourceDto>>;

public sealed record SharedResourceDto(
    Guid Id,
    string Name,
    string? Description,
    Guid ResourceTypeId,
    string ResourceTypeName,
    string ResourceTypeCode,
    string? EnvironmentScope,
    Dictionary<string, object?> ConnectionFields,
    Dictionary<string, object?> FieldSchema);
