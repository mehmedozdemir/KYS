using Kys.Domain.Enumerations;

namespace Kys.Domain.Interfaces.Repositories;

/// <summary>Ürün × müşteri kurulum görünümleri için salt-okuma veri erişimi.</summary>
public interface IDeploymentRepository
{
    Task<IReadOnlyList<DeploymentProductRow>> GetProductsAsync(Guid? productId, CancellationToken ct = default);
    Task<IReadOnlyList<DeploymentCustomerRow>> GetCustomersAsync(CancellationToken ct = default);
    Task<IReadOnlyList<DeploymentLinkRow>> GetLinksAsync(Guid? productId, CancellationToken ct = default);
    Task<IReadOnlyList<DeploymentEnvironmentRow>> GetEnvironmentsAsync(Guid? productId, CancellationToken ct = default);
}

public sealed record DeploymentProductRow(Guid Id, string Name, string Code, string? Version, ProductType ProductType);

public sealed record DeploymentCustomerRow(Guid Id, string Name, string Code, CustomerStatus Status, bool IsArchived);

public sealed record DeploymentLinkRow(
    Guid Id, Guid CustomerId, Guid ProductId, UsageMode UsageMode, CustomerProductStatus Status, DateTime CreatedAt,
    DateOnly? InstallationStartedAt, DateOnly? TestReadyAt, DateOnly? ProdReadyAt,
    DateOnly? GoLiveAt, DateOnly? TargetGoLiveAt, DateOnly? DiscontinuedAt);

public sealed record DeploymentEnvironmentRow(
    Guid Id, Guid CustomerProductId, string Name, string TypeCode, string TypeName, string? TypeColor, int TypeSortOrder,
    string? PlatformName, string? DeployedVersion, bool IsActive);
