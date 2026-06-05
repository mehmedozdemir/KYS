using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Environments.Queries.GetEnvironmentTypes;

public sealed class GetEnvironmentTypesQueryHandler(IEnvironmentRepository repository)
    : IRequestHandler<GetEnvironmentTypesQuery, IReadOnlyList<EnvironmentTypeDto>>
{
    public async Task<IReadOnlyList<EnvironmentTypeDto>> Handle(GetEnvironmentTypesQuery request, CancellationToken ct)
    {
        var types = await repository.GetEnvironmentTypesAsync(ct);
        return types.Select(t => new EnvironmentTypeDto(
            t.Id, t.Name, t.Code, t.Description, t.SortOrder, t.Color, t.IsActive)).ToList();
    }
}
