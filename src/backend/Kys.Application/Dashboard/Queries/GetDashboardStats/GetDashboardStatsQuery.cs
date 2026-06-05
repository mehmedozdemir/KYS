using MediatR;

namespace Kys.Application.Dashboard.Queries.GetDashboardStats;

public sealed record GetDashboardStatsQuery : IRequest<DashboardStatsDto>;

public sealed record DashboardStatsDto(
    int ActiveCustomerCount,
    int OnboardingCustomerCount,
    int TotalProductCount,
    int ActiveProductCount,
    int TotalTeamCount,
    int TotalPersonCount,
    int ActivePersonCount);
