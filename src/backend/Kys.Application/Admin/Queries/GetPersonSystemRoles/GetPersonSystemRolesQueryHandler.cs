using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Admin.Queries.GetPersonSystemRoles;

public sealed class GetPersonSystemRolesQueryHandler(
    IPersonRepository personRepository,
    ISystemRoleRepository systemRoleRepository
) : IRequestHandler<GetPersonSystemRolesQuery, IReadOnlyList<SystemRoleDto>>
{
    public async Task<IReadOnlyList<SystemRoleDto>> Handle(
        GetPersonSystemRolesQuery request,
        CancellationToken cancellationToken)
    {
        _ = await personRepository.GetByIdAsync(request.PersonId, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Person), request.PersonId);

        var assignments = await systemRoleRepository.GetByPersonAsync(request.PersonId, cancellationToken);

        return assignments.Select(a => new SystemRoleDto(
            a.SystemRole.Id,
            a.SystemRole.Name,
            a.SystemRole.Code,
            a.SystemRole.Permissions.AsReadOnly(),
            a.AssignedAt
        )).ToList();
    }
}
