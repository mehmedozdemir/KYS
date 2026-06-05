using MediatR;

namespace Kys.Application.Teams.Queries.GetTeamDetail;

public sealed record GetTeamDetailQuery(Guid Id) : IRequest<TeamDetailDto>;

public sealed record TeamDetailDto(
    Guid Id,
    string Name,
    string? Description,
    string TeamType,
    IReadOnlyList<TeamMemberDto> Members
);

public sealed record TeamMemberDto(
    Guid PersonId,
    string FullName,
    string OrganizationRole,
    DateOnly StartDate,
    DateOnly? EndDate
);
