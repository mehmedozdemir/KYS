using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Admin.Queries.GetPlatformStats;

public sealed class GetPlatformStatsQueryHandler(IDashboardRepository repository)
    : IRequestHandler<GetPlatformStatsQuery, PlatformStatsDto>
{
    public async Task<PlatformStatsDto> Handle(GetPlatformStatsQuery request, CancellationToken ct)
    {
        var stats = await repository.GetStatsAsync(ct);
        return new PlatformStatsDto(
            stats.TotalPersonCount,
            stats.ActivePersonCount,
            stats.TotalTeamCount,
            stats.TotalProductCount,
            stats.ActiveCustomerCount + stats.OnboardingCustomerCount,
            0,
            0);
    }
}
