using MediatR;

namespace Kys.Application.Teams.Commands.AddTeamMember;

public sealed record AddTeamMemberCommand(
    Guid TeamId,
    Guid PersonId,
    Guid OrganizationRoleId,
    DateOnly StartDate
) : IRequest<Guid>;
