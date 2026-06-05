using MediatR;

namespace Kys.Application.Admin.Queries.GetPlatformStats;

public sealed record GetPlatformStatsQuery : IRequest<PlatformStatsDto>;

public sealed record PlatformStatsDto(
    int TotalPeople,
    int ActivePeople,
    int TotalTeams,
    int TotalProducts,
    int TotalCustomers,
    int TotalKbArticles,
    int AuditLogsLast30Days);
