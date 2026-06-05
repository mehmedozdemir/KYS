using Kys.Domain.Entities;
using Kys.Domain.Interfaces.Repositories;
using Kys.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kys.Infrastructure.Persistence.Repositories;

public sealed class ResourceRepository(AppDbContext db) : IResourceRepository
{
    public async Task<IReadOnlyList<ResourceType>> GetResourceTypesAsync(bool activeOnly = true, CancellationToken ct = default)
    {
        var query = db.ResourceTypes.AsQueryable();
        if (activeOnly) query = query.Where(x => x.IsActive);
        return await query.OrderBy(x => x.Name).ToListAsync(ct);
    }

    public async Task<ResourceType?> GetResourceTypeByIdAsync(Guid id, CancellationToken ct = default)
        => await db.ResourceTypes.FindAsync([id], ct);

    public async Task AddResourceTypeAsync(ResourceType resourceType, CancellationToken ct = default)
        => await db.ResourceTypes.AddAsync(resourceType, ct);

    public void UpdateResourceType(ResourceType resourceType)
        => db.ResourceTypes.Update(resourceType);

    public async Task<IReadOnlyList<SharedResource>> GetSharedResourcesAsync(string? scope = null, CancellationToken ct = default)
    {
        var query = db.SharedResources
            .Include(x => x.ResourceType)
            .AsQueryable();

        if (scope is not null)
            query = query.Where(x => x.EnvironmentScope == scope || x.EnvironmentScope == "All");

        return await query.OrderBy(x => x.Name).ToListAsync(ct);
    }

    public async Task<SharedResource?> GetSharedResourceByIdAsync(Guid id, CancellationToken ct = default)
        => await db.SharedResources
            .Include(x => x.ResourceType)
            .FirstOrDefaultAsync(x => x.Id == id, ct);

    public async Task AddSharedResourceAsync(SharedResource sharedResource, CancellationToken ct = default)
        => await db.SharedResources.AddAsync(sharedResource, ct);

    public void UpdateSharedResource(SharedResource sharedResource)
        => db.SharedResources.Update(sharedResource);
}
