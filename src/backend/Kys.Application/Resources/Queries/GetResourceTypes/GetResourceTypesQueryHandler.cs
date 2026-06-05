using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Resources.Queries.GetResourceTypes;

public sealed class GetResourceTypesQueryHandler(IResourceRepository repository)
    : IRequestHandler<GetResourceTypesQuery, IReadOnlyList<ResourceTypeDto>>
{
    public async Task<IReadOnlyList<ResourceTypeDto>> Handle(GetResourceTypesQuery request, CancellationToken ct)
    {
        var types = await repository.GetResourceTypesAsync(request.ActiveOnly, ct);
        return types.Select(t => new ResourceTypeDto(
            t.Id, t.Name, t.Code, t.Category, t.Icon, t.Description, t.IsActive)).ToList();
    }
}
