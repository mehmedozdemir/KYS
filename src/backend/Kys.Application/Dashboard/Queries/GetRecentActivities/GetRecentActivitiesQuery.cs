using MediatR;

namespace Kys.Application.Dashboard.Queries.GetRecentActivities;

public sealed record GetRecentActivitiesQuery(int Count = 20) : IRequest<IReadOnlyList<RecentActivityDto>>;

public sealed record RecentActivityDto(
    Guid Id,
    string EntityType,
    Guid EntityId,
    string? EntityName,
    string Action,
    Guid? ChangedBy,
    string? ChangedByName,
    DateTime ChangedAt);
