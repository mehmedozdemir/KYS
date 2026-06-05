using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Teams.Queries.GetTeamDetail;

public sealed class GetTeamDetailQueryHandler(ITeamRepository teamRepository)
    : IRequestHandler<GetTeamDetailQuery, TeamDetailDto>
{
    public async Task<TeamDetailDto> Handle(GetTeamDetailQuery request, CancellationToken cancellationToken)
    {
        var team = await teamRepository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Team), request.Id);

        var members = team.Memberships
            .Select(m => new TeamMemberDto(
                m.Person.Id,
                m.Person.FullName,
                m.OrganizationRole.Name,
                m.StartDate,
                m.EndDate))
            .OrderBy(m => m.FullName)
            .ToList();

        return new TeamDetailDto(team.Id, team.Name, team.Description, team.TeamType, members);
    }
}
