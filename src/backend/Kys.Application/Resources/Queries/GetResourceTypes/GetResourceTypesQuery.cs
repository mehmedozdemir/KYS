using MediatR;

namespace Kys.Application.Resources.Queries.GetResourceTypes;

public sealed record GetResourceTypesQuery(bool ActiveOnly = true)
    : IRequest<IReadOnlyList<ResourceTypeDto>>;

public sealed record ResourceTypeDto(
    Guid Id,
    string Name,
    string Code,
    string? Category,
    string? Icon,
    string? Description,
    bool IsActive,
    Dictionary<string, object?> FieldSchema);
