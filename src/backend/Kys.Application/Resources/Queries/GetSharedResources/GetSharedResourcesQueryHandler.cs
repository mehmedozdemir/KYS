using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Resources.Queries.GetSharedResources;

public sealed class GetSharedResourcesQueryHandler(IResourceRepository repository)
    : IRequestHandler<GetSharedResourcesQuery, IReadOnlyList<SharedResourceDto>>
{
    public async Task<IReadOnlyList<SharedResourceDto>> Handle(GetSharedResourcesQuery request, CancellationToken ct)
    {
        var resources = await repository.GetSharedResourcesAsync(request.Scope, ct);
        return resources.Select(r => new SharedResourceDto(
            r.Id,
            r.Name,
            r.Description,
            r.ResourceType.Name,
            r.ResourceType.Code,
            r.EnvironmentScope)).ToList();
    }
}
