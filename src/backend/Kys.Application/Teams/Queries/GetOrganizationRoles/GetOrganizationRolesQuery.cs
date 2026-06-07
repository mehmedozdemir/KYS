using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Teams.Queries.GetOrganizationRoles;

public sealed record GetOrganizationRolesQuery : IRequest<IReadOnlyList<OrganizationRoleDto>>;

public sealed record OrganizationRoleDto(Guid Id, string Name);

public sealed class GetOrganizationRolesQueryHandler(ITeamRepository teamRepository)
    : IRequestHandler<GetOrganizationRolesQuery, IReadOnlyList<OrganizationRoleDto>>
{
    public async Task<IReadOnlyList<OrganizationRoleDto>> Handle(
        GetOrganizationRolesQuery request, CancellationToken cancellationToken)
    {
        var roles = await teamRepository.GetOrganizationRolesAsync(cancellationToken);
        return roles.Select(r => new OrganizationRoleDto(r.Id, r.Name)).ToList();
    }
}
