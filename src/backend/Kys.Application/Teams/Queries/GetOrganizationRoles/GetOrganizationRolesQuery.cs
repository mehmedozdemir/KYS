using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Teams.Queries.GetOrganizationRoles;

public sealed record GetOrganizationRolesQuery : IRequest<IReadOnlyList<OrganizationRoleDto>>;

public sealed record OrganizationRoleDto(Guid Id, string Name, string? Description, int ActiveMemberCount);

public sealed class GetOrganizationRolesQueryHandler(ITeamRepository teamRepository)
    : IRequestHandler<GetOrganizationRolesQuery, IReadOnlyList<OrganizationRoleDto>>
{
    public async Task<IReadOnlyList<OrganizationRoleDto>> Handle(
        GetOrganizationRolesQuery request, CancellationToken cancellationToken)
    {
        var roles = await teamRepository.GetOrganizationRolesAsync(cancellationToken);
        var result = new List<OrganizationRoleDto>(roles.Count);
        foreach (var r in roles)
            result.Add(new OrganizationRoleDto(r.Id, r.Name, r.Description,
                await teamRepository.CountActiveMembershipsForRoleAsync(r.Id, cancellationToken)));
        return result;
    }
}
