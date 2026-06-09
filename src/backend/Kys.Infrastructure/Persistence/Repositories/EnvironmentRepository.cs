using Kys.Domain.Entities;
using Kys.Domain.Interfaces.Repositories;
using Kys.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kys.Infrastructure.Persistence.Repositories;

public sealed class EnvironmentRepository(AppDbContext db) : IEnvironmentRepository
{
    public async Task<IReadOnlyList<EnvironmentType>> GetEnvironmentTypesAsync(CancellationToken ct = default)
        => await db.EnvironmentTypes.Where(x => x.IsActive).OrderBy(x => x.SortOrder).ToListAsync(ct);

    public async Task<EnvironmentType?> GetEnvironmentTypeByIdAsync(Guid id, CancellationToken ct = default)
        => await db.EnvironmentTypes.FindAsync([id], ct);

    public async Task AddEnvironmentTypeAsync(EnvironmentType environmentType, CancellationToken ct = default)
        => await db.EnvironmentTypes.AddAsync(environmentType, ct);

    public void UpdateEnvironmentType(EnvironmentType environmentType)
        => db.EnvironmentTypes.Update(environmentType);

    public void DeleteEnvironmentType(EnvironmentType environmentType)
        => db.EnvironmentTypes.Remove(environmentType);

    public async Task<int> CountEnvironmentsByTypeAsync(Guid environmentTypeId, CancellationToken ct = default)
        => await db.CustomerEnvironments.CountAsync(e => e.EnvironmentTypeId == environmentTypeId, ct);

    public async Task<IReadOnlyList<HostingPlatform>> GetHostingPlatformsAsync(bool activeOnly = true, CancellationToken ct = default)
    {
        var query = db.HostingPlatforms.AsQueryable();
        if (activeOnly) query = query.Where(x => x.IsActive);
        return await query.OrderBy(x => x.SortOrder).ThenBy(x => x.Name).ToListAsync(ct);
    }

    public async Task<HostingPlatform?> GetHostingPlatformByIdAsync(Guid id, CancellationToken ct = default)
        => await db.HostingPlatforms.FindAsync([id], ct);

    public async Task AddHostingPlatformAsync(HostingPlatform platform, CancellationToken ct = default)
        => await db.HostingPlatforms.AddAsync(platform, ct);

    public void UpdateHostingPlatform(HostingPlatform platform)
        => db.HostingPlatforms.Update(platform);

    public void DeleteHostingPlatform(HostingPlatform platform)
        => db.HostingPlatforms.Remove(platform);

    public async Task<int> CountEnvironmentsByPlatformAsync(Guid hostingPlatformId, CancellationToken ct = default)
        => await db.CustomerEnvironments.CountAsync(e => e.HostingPlatformId == hostingPlatformId, ct);

    public async Task<IReadOnlyList<CustomerEnvironment>> GetByCustomerProductAsync(Guid customerProductId, CancellationToken ct = default)
        => await db.CustomerEnvironments
            .Include(x => x.EnvironmentType)
            .Include(x => x.HostingPlatform)
            .Include(x => x.Resources)
            .Where(x => x.CustomerProductId == customerProductId)
            .OrderBy(x => x.EnvironmentType.SortOrder)
            .ToListAsync(ct);

    public async Task<CustomerEnvironment?> GetEnvironmentByIdAsync(Guid id, CancellationToken ct = default)
        => await db.CustomerEnvironments
            .Include(x => x.EnvironmentType)
            .Include(x => x.HostingPlatform)
            .Include(x => x.Resources)
                .ThenInclude(r => r.ProductResourceTemplate)
                    .ThenInclude(t => t.ResourceType)
            .Include(x => x.Resources)
                .ThenInclude(r => r.Credentials)
            .Include(x => x.Resources)
                .ThenInclude(r => r.SharedResource)
                    .ThenInclude(sr => sr!.ResourceType)
            .Include(x => x.Endpoints)
                .ThenInclude(e => e.ProductEndpoint)
            .Include(x => x.Endpoints)
                .ThenInclude(e => e.Credentials)
            .Include(x => x.CustomerProduct)
                .ThenInclude(cp => cp.Customer)
            .Include(x => x.CustomerProduct)
                .ThenInclude(cp => cp.Product)
                    .ThenInclude(p => p.Endpoints)
            .Include(x => x.CustomerProduct)
                .ThenInclude(cp => cp.Product)
                    .ThenInclude(p => p.ResourceTemplates)
                        .ThenInclude(rt => rt.ResourceType)
            .Include(x => x.CustomerProduct)
                .ThenInclude(cp => cp.Product)
                    .ThenInclude(p => p.ResourceTemplates)
                        .ThenInclude(rt => rt.SharedResource)
            .FirstOrDefaultAsync(x => x.Id == id, ct);

    public async Task AddCustomerEnvironmentAsync(CustomerEnvironment environment, CancellationToken ct = default)
        => await db.CustomerEnvironments.AddAsync(environment, ct);

    public void RemoveCustomerEnvironment(CustomerEnvironment environment)
        => db.CustomerEnvironments.Remove(environment);

    public async Task<int> CountEnvironmentsByCustomerProductAsync(Guid customerProductId, CancellationToken ct = default)
        => await db.CustomerEnvironments.CountAsync(e => e.CustomerProductId == customerProductId, ct);

    public async Task<int> CountResourcesByEnvironmentAsync(Guid environmentId, CancellationToken ct = default)
        => await db.EnvironmentResources.CountAsync(r => r.CustomerEnvironmentId == environmentId, ct);

    public async Task<EnvironmentResource?> GetResourceByIdAsync(Guid id, CancellationToken ct = default)
        => await db.EnvironmentResources
            .Include(x => x.Credentials)
            .FirstOrDefaultAsync(x => x.Id == id, ct);

    public async Task AddEnvironmentResourceAsync(EnvironmentResource resource, CancellationToken ct = default)
        => await db.EnvironmentResources.AddAsync(resource, ct);

    public void UpdateEnvironmentResource(EnvironmentResource resource)
        => db.EnvironmentResources.Update(resource);

    public async Task<ResourceCredential?> GetCredentialAsync(Guid environmentResourceId, string fieldKey, CancellationToken ct = default)
        => await db.ResourceCredentials
            .FirstOrDefaultAsync(x => x.EnvironmentResourceId == environmentResourceId && x.FieldKey == fieldKey, ct);

    public async Task<ResourceCredential?> GetEndpointCredentialAsync(Guid endpointUrlId, string fieldKey, CancellationToken ct = default)
        => await db.ResourceCredentials
            .FirstOrDefaultAsync(x => x.EndpointUrlId == endpointUrlId && x.FieldKey == fieldKey, ct);

    public async Task<ResourceCredential?> GetSharedCredentialAsync(Guid sharedResourceId, string fieldKey, CancellationToken ct = default)
        => await db.ResourceCredentials
            .FirstOrDefaultAsync(x => x.SharedResourceId == sharedResourceId && x.FieldKey == fieldKey, ct);

    public async Task<IReadOnlyList<ResourceCredential>> GetSharedCredentialsAsync(Guid sharedResourceId, CancellationToken ct = default)
        => await db.ResourceCredentials
            .Where(x => x.SharedResourceId == sharedResourceId)
            .ToListAsync(ct);

    public async Task AddCredentialAsync(ResourceCredential credential, CancellationToken ct = default)
        => await db.ResourceCredentials.AddAsync(credential, ct);

    public void UpdateCredential(ResourceCredential credential)
        => db.ResourceCredentials.Update(credential);

    public void DeleteCredential(ResourceCredential credential)
        => db.ResourceCredentials.Remove(credential);

    public async Task<ResourceCredential?> GetCredentialByIdAsync(Guid id, CancellationToken ct = default)
        => await db.ResourceCredentials.FindAsync([id], ct);

    public async Task<CustomerEnvironmentEndpoint?> GetEndpointAsync(Guid customerEnvironmentId, Guid productEndpointId, CancellationToken ct = default)
        => await db.CustomerEnvironmentEndpoints
            .FirstOrDefaultAsync(x => x.CustomerEnvironmentId == customerEnvironmentId && x.ProductEndpointId == productEndpointId, ct);

    public async Task AddEndpointUrlAsync(CustomerEnvironmentEndpoint endpoint, CancellationToken ct = default)
        => await db.CustomerEnvironmentEndpoints.AddAsync(endpoint, ct);

    public void UpdateEndpointUrl(CustomerEnvironmentEndpoint endpoint)
        => db.CustomerEnvironmentEndpoints.Update(endpoint);

    public void RemoveEndpointUrl(CustomerEnvironmentEndpoint endpoint)
        => db.CustomerEnvironmentEndpoints.Remove(endpoint);
}
