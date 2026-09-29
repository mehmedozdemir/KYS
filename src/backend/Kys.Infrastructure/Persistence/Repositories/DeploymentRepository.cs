using Kys.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Kys.Infrastructure.Persistence.Repositories;

public sealed class DeploymentRepository(AppDbContext db) : IDeploymentRepository
{
    public async Task<IReadOnlyList<DeploymentProductRow>> GetProductsAsync(Guid? productId, CancellationToken ct = default)
        => await db.Products.AsNoTracking()
            .Where(p => productId == null || p.Id == productId)
            .OrderBy(p => p.Name)
            .Select(p => new DeploymentProductRow(p.Id, p.Name, p.Code, p.Version, p.ProductType))
            .ToListAsync(ct);

    public async Task<IReadOnlyList<DeploymentCustomerRow>> GetCustomersAsync(CancellationToken ct = default)
        => await db.Customers.AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new DeploymentCustomerRow(c.Id, c.Name, c.Code, c.Status, c.IsArchived))
            .ToListAsync(ct);

    public async Task<IReadOnlyList<DeploymentLinkRow>> GetLinksAsync(Guid? productId, CancellationToken ct = default)
        => await db.CustomerProducts.AsNoTracking()
            .Where(cp => productId == null || cp.ProductId == productId)
            .Select(cp => new DeploymentLinkRow(
                cp.Id, cp.CustomerId, cp.ProductId, cp.UsageMode, cp.Status, cp.CreatedAt,
                cp.InstallationStartedAt, cp.TestReadyAt, cp.ProdReadyAt, cp.GoLiveAt, cp.TargetGoLiveAt, cp.DiscontinuedAt))
            .ToListAsync(ct);

    public async Task<IReadOnlyList<DeploymentEnvironmentRow>> GetEnvironmentsAsync(Guid? productId, CancellationToken ct = default)
        => await db.CustomerEnvironments.AsNoTracking()
            .Where(e => productId == null || e.CustomerProduct.ProductId == productId)
            .OrderBy(e => e.EnvironmentType.SortOrder)
            .Select(e => new DeploymentEnvironmentRow(
                e.Id, e.CustomerProductId, e.Name, e.EnvironmentType.Code, e.EnvironmentType.Name, e.EnvironmentType.Color,
                e.EnvironmentType.SortOrder, e.HostingPlatform != null ? e.HostingPlatform.Name : null, e.DeployedVersion, e.IsActive))
            .ToListAsync(ct);
}
