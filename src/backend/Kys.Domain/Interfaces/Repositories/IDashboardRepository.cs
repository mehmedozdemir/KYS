using Kys.Domain.Entities;

namespace Kys.Domain.Interfaces.Repositories;

public interface IDashboardRepository
{
    Task<DashboardStatsResult> GetStatsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<RecentActivityResult>> GetRecentActivitiesAsync(int count, CancellationToken ct = default);

    /// <summary>
    /// Returns active environments for the workspace widget. When <paramref name="allCustomers"/> is false,
    /// scopes to customers using products the person is responsible for (direct assignment or via team).
    /// </summary>
    Task<IReadOnlyList<CustomerEnvironment>> GetWorkspaceEnvironmentsAsync(
        Guid personId, bool allCustomers, CancellationToken ct = default);
}

public sealed record DashboardStatsResult(
    int ActiveCustomerCount,
    int OnboardingCustomerCount,
    int TotalProductCount,
    int ActiveProductCount,
    int TotalTeamCount,
    int TotalPersonCount,
    int ActivePersonCount);

public sealed record RecentActivityResult(
    Guid Id,
    string EntityType,
    Guid EntityId,
    string? EntityName,
    string Action,
    Guid? ChangedBy,
    string? ChangedByName,
    DateTime ChangedAt);
