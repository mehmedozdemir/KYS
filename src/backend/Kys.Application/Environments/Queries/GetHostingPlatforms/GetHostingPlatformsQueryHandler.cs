using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Environments.Queries.GetHostingPlatforms;

public sealed class GetHostingPlatformsQueryHandler(IEnvironmentRepository repository)
    : IRequestHandler<GetHostingPlatformsQuery, IReadOnlyList<HostingPlatformDto>>
{
    public async Task<IReadOnlyList<HostingPlatformDto>> Handle(GetHostingPlatformsQuery request, CancellationToken ct)
    {
        var platforms = await repository.GetHostingPlatformsAsync(request.ActiveOnly, ct);
        return platforms.Select(p => new HostingPlatformDto(
            p.Id, p.Name, p.Code, p.Description, p.Category, p.Icon, p.Color, p.SortOrder, p.IsActive)).ToList();
    }
}
