using MediatR;

namespace Kys.Application.Teams.Queries.GetTeams;

public sealed record GetTeamsQuery : IRequest<IReadOnlyList<TeamListDto>>;

public sealed record TeamListDto(Guid Id, string Name, string TeamType, int ActiveMemberCount);
