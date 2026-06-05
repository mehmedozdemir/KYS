using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Dashboard.Queries.GetDashboardStats;

public sealed class GetDashboardStatsQueryHandler(IDashboardRepository repository)
    : IRequestHandler<GetDashboardStatsQuery, DashboardStatsDto>
{
    public async Task<DashboardStatsDto> Handle(GetDashboardStatsQuery request, CancellationToken ct)
    {
        var stats = await repository.GetStatsAsync(ct);
        return new DashboardStatsDto(
            stats.ActiveCustomerCount,
            stats.OnboardingCustomerCount,
            stats.TotalProductCount,
            stats.ActiveProductCount,
            stats.TotalTeamCount,
            stats.TotalPersonCount,
            stats.ActivePersonCount);
    }
}
