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

    public async Task<IReadOnlyList<CustomerEnvironment>> GetByCustomerProductAsync(Guid customerProductId, CancellationToken ct = default)
        => await db.CustomerEnvironments
            .Include(x => x.EnvironmentType)
            .Include(x => x.Resources)
            .Where(x => x.CustomerProductId == customerProductId)
            .OrderBy(x => x.EnvironmentType.SortOrder)
            .ToListAsync(ct);

    public async Task<CustomerEnvironment?> GetEnvironmentByIdAsync(Guid id, CancellationToken ct = default)
        => await db.CustomerEnvironments
            .Include(x => x.EnvironmentType)
            .Include(x => x.Resources)
                .ThenInclude(r => r.ProductResourceTemplate)
                    .ThenInclude(t => t.ResourceType)
            .Include(x => x.Endpoints)
                .ThenInclude(e => e.ProductEndpoint)
            .FirstOrDefaultAsync(x => x.Id == id, ct);

    public async Task AddCustomerEnvironmentAsync(CustomerEnvironment environment, CancellationToken ct = default)
        => await db.CustomerEnvironments.AddAsync(environment, ct);

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

    public async Task AddCredentialAsync(ResourceCredential credential, CancellationToken ct = default)
        => await db.ResourceCredentials.AddAsync(credential, ct);

    public void UpdateCredential(ResourceCredential credential)
        => db.ResourceCredentials.Update(credential);

    public async Task<ResourceCredential?> GetCredentialByIdAsync(Guid id, CancellationToken ct = default)
        => await db.ResourceCredentials.FindAsync([id], ct);

    public async Task<CustomerEnvironmentEndpoint?> GetEndpointAsync(Guid customerEnvironmentId, Guid productEndpointId, CancellationToken ct = default)
        => await db.CustomerEnvironmentEndpoints
            .FirstOrDefaultAsync(x => x.CustomerEnvironmentId == customerEnvironmentId && x.ProductEndpointId == productEndpointId, ct);

    public async Task AddEndpointUrlAsync(CustomerEnvironmentEndpoint endpoint, CancellationToken ct = default)
        => await db.CustomerEnvironmentEndpoints.AddAsync(endpoint, ct);

    public void UpdateEndpointUrl(CustomerEnvironmentEndpoint endpoint)
        => db.CustomerEnvironmentEndpoints.Update(endpoint);
}
