using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Dashboard.Queries.GetRecentActivities;

public sealed class GetRecentActivitiesQueryHandler(IDashboardRepository repository)
    : IRequestHandler<GetRecentActivitiesQuery, IReadOnlyList<RecentActivityDto>>
{
    public async Task<IReadOnlyList<RecentActivityDto>> Handle(GetRecentActivitiesQuery request, CancellationToken ct)
    {
        var activities = await repository.GetRecentActivitiesAsync(request.Count, ct);
        return activities.Select(a => new RecentActivityDto(
            a.Id,
            a.EntityType,
            a.EntityId,
            a.EntityName,
            a.Action,
            a.ChangedBy,
            a.ChangedByName,
            a.ChangedAt)).ToList();
    }
}
