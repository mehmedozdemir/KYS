using MediatR;

namespace Kys.Application.Environments.Queries.GetHostingPlatforms;

public sealed record GetHostingPlatformsQuery(bool ActiveOnly = true)
    : IRequest<IReadOnlyList<HostingPlatformDto>>;

public sealed record HostingPlatformDto(
    Guid Id,
    string Name,
    string Code,
    string? Description,
    string? Category,
    string? Icon,
    string? Color,
    int SortOrder,
    bool IsActive);
