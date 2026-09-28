using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Admin.Queries.GetSystemRoles;

public sealed class GetSystemRolesQueryHandler(ISystemRoleRepository systemRoleRepository)
    : IRequestHandler<GetSystemRolesQuery, IReadOnlyList<SystemRoleOptionDto>>
{
    public async Task<IReadOnlyList<SystemRoleOptionDto>> Handle(GetSystemRolesQuery request, CancellationToken cancellationToken)
    {
        var roles = await systemRoleRepository.GetAllAsync(cancellationToken);
        return roles
            .OrderBy(r => r.Name)
            .Select(r => new SystemRoleOptionDto(r.Id, r.Name, r.Code, r.Description))
            .ToList();
    }
}
