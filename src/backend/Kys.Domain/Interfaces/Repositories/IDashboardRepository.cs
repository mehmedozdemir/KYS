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

    /// <summary>Yönetici özeti: müşteri hattı, devreye almalar, canlıya geçişler, ürün yaygınlığı,
    /// müşteri özel alanlarından yaklaşan tarihler ve sayısal toplamlar, güvenlik göstergeleri.</summary>
    Task<ExecutiveSummaryResult> GetExecutiveSummaryAsync(CancellationToken ct = default);
}

public sealed record ExecutiveSummaryResult(
    IReadOnlyList<StatusCountResult> CustomerPipeline,
    IReadOnlyList<OnboardingCustomerResult> Onboarding,
    IReadOnlyList<GoLiveResult> RecentGoLives,
    IReadOnlyList<ProductAdoptionResult> ProductAdoption,
    IReadOnlyList<UpcomingDateResult> UpcomingDates,
    IReadOnlyList<NumberTotalResult> NumberTotals,
    int CredentialRevealsLast30Days,
    int ChangesLast7Days);

public sealed record StatusCountResult(string Status, int Count);
public sealed record OnboardingCustomerResult(Guid Id, string Name, string Code, DateOnly? OnboardingStartedAt,
    DateOnly? TestEnvReadyAt, DateOnly? ProdEnvReadyAt);
public sealed record GoLiveResult(Guid CustomerId, string CustomerName, string ProductName, DateOnly GoLiveAt);
public sealed record ProductAdoptionResult(Guid ProductId, string Name, string Code, int CustomerCount, int LiveCount);
public sealed record UpcomingDateResult(Guid CustomerId, string CustomerName, string FieldName, DateOnly Date);
public sealed record NumberTotalResult(string FieldName, decimal Total, int CustomerCount);

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
