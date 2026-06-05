using MediatR;

namespace Kys.Application.Environments.Queries.GetEnvironmentTypes;

public sealed record GetEnvironmentTypesQuery : IRequest<IReadOnlyList<EnvironmentTypeDto>>;

public sealed record EnvironmentTypeDto(
    Guid Id,
    string Name,
    string Code,
    string? Description,
    int SortOrder,
    string? Color,
    bool IsActive);
