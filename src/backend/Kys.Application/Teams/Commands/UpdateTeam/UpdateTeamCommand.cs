using MediatR;

namespace Kys.Application.Teams.Commands.UpdateTeam;

public sealed record UpdateTeamCommand(Guid Id, string Name, string? Code, string? Description, string TeamType) : IRequest;
