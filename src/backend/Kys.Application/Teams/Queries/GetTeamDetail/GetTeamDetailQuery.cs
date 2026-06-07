using MediatR;

namespace Kys.Application.Teams.Queries.GetTeamDetail;

public sealed record GetTeamDetailQuery(Guid Id) : IRequest<TeamDetailDto>;

public sealed record TeamDetailDto(
    Guid Id,
    string Name,
    string? Description,
    bool IsActive,
    IReadOnlyList<TeamMemberDto> Members
);

public sealed record TeamMemberDto(
    Guid MembershipId,
    Guid PersonId,
    string PersonName,
    string PersonEmail,
    Guid OrganizationRoleId,
    string OrganizationRoleName,
    DateOnly StartDate,
    DateOnly? EndDate
);
