using MediatR;

namespace Kys.Application.Teams.Commands.DeleteTeam;

public sealed record DeleteTeamCommand(Guid Id) : IRequest;
