using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Grants.Queries.GetGrants;

public sealed class GetGrantsQueryHandler(IAccessGrantRepository repository)
    : IRequestHandler<GetGrantsQuery, IReadOnlyList<AccessGrantDto>>
{
    public async Task<IReadOnlyList<AccessGrantDto>> Handle(GetGrantsQuery request, CancellationToken ct)
    {
        var grants = await repository.GetAllAsync(request.PersonId, ct);
        return grants.Select(g => new AccessGrantDto(
            g.Id, g.PersonId, g.Person?.FullName ?? "—",
            g.Kind, g.ScopeType, g.ScopeId, g.Level, g.Capability,
            g.GrantedAt, g.ExpiresAt)).ToList();
    }
}
