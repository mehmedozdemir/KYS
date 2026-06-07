using MediatR;

namespace Kys.Application.Teams.Commands.CreateTeam;

public sealed record CreateTeamCommand(string Name, string? Code, string? Description, string TeamType) : IRequest<Guid>;
