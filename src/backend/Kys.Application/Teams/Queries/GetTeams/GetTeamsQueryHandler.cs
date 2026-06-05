using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Teams.Queries.GetTeams;

public sealed class GetTeamsQueryHandler(ITeamRepository teamRepository)
    : IRequestHandler<GetTeamsQuery, IReadOnlyList<TeamListDto>>
{
    public async Task<IReadOnlyList<TeamListDto>> Handle(GetTeamsQuery request, CancellationToken cancellationToken)
    {
        var teams = await teamRepository.GetAllAsync(cancellationToken);
        return teams
            .Select(t => new TeamListDto(t.Id, t.Name, t.TeamType, t.Memberships.Count(m => m.IsActive)))
            .ToList();
    }
}
