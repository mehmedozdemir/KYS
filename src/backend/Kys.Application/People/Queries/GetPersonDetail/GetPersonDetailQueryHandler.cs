using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.People.Queries.GetPersonDetail;

public sealed class GetPersonDetailQueryHandler(IPersonRepository personRepository)
    : IRequestHandler<GetPersonDetailQuery, PersonDetailDto>
{
    public async Task<PersonDetailDto> Handle(GetPersonDetailQuery request, CancellationToken cancellationToken)
    {
        var person = await personRepository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Person), request.Id);

        var roles = person.SystemRoles
            .Select(psr => new PersonRoleDto(psr.SystemRole.Id, psr.SystemRole.Name, psr.SystemRole.Code))
            .ToList();

        var memberships = person.TeamMemberships
            .Select(tm => new PersonTeamDto(tm.Team.Id, tm.Team.Name, tm.OrganizationRole.Name, tm.StartDate, tm.EndDate))
            .ToList();

        return new PersonDetailDto(
            person.Id,
            person.FirstName,
            person.LastName,
            person.Email,
            person.Phone,
            person.Title,
            person.EmploymentStatus,
            person.HireDate,
            person.TerminationDate,
            person.IsPlatformUser,
            person.Username,
            person.IsLocked,
            person.LastLoginAt,
            roles,
            memberships,
            person.CustomFields
        );
    }
}
