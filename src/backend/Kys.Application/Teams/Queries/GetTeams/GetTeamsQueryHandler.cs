using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Teams.Queries.GetTeams;

public sealed class GetTeamsQueryHandler(ITeamRepository teamRepository)
    : IRequestHandler<GetTeamsQuery, PagedTeamsResult>
{
    public async Task<PagedTeamsResult> Handle(GetTeamsQuery request, CancellationToken cancellationToken)
    {
        var all = await teamRepository.GetAllAsync(cancellationToken);

        var filtered = string.IsNullOrWhiteSpace(request.Search)
            ? all
            : all.Where(t => t.Name.Contains(request.Search, StringComparison.OrdinalIgnoreCase)
                          || (t.Description != null && t.Description.Contains(request.Search, StringComparison.OrdinalIgnoreCase)));

        var totalCount = filtered.Count();
        var items = filtered
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(t => new TeamListDto(t.Id, t.Name, t.Code, t.Description, t.Memberships.Count(m => m.IsActive), !t.IsDeleted))
            .ToList();

        return new PagedTeamsResult(items, totalCount, request.Page, request.PageSize);
    }
}
