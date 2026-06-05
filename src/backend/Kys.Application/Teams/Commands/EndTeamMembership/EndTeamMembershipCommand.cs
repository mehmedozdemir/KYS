using MediatR;

namespace Kys.Application.Teams.Commands.EndTeamMembership;

public sealed record EndTeamMembershipCommand(Guid PersonId, Guid TeamId, DateOnly EndDate) : IRequest;
