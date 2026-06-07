using MediatR;

namespace Kys.Application.Teams.Queries.GetTeams;

public sealed record GetTeamsQuery(string? Search = null, int Page = 1, int PageSize = 20)
    : IRequest<PagedTeamsResult>;

public sealed record PagedTeamsResult(IReadOnlyList<TeamListDto> Items, int TotalCount, int Page, int PageSize);

public sealed record TeamListDto(Guid Id, string Name, string? Code, string? Description, int MemberCount, bool IsActive);
