using Kys.Domain.Entities;

namespace Kys.Domain.Interfaces.Repositories;

public interface IResourceRepository
{
    Task<IReadOnlyList<ResourceType>> GetResourceTypesAsync(bool activeOnly = true, CancellationToken ct = default);
    Task<ResourceType?> GetResourceTypeByIdAsync(Guid id, CancellationToken ct = default);
    Task AddResourceTypeAsync(ResourceType resourceType, CancellationToken ct = default);
    void UpdateResourceType(ResourceType resourceType);

    Task<IReadOnlyList<SharedResource>> GetSharedResourcesAsync(string? scope = null, CancellationToken ct = default);
    Task<SharedResource?> GetSharedResourceByIdAsync(Guid id, CancellationToken ct = default);
    Task AddSharedResourceAsync(SharedResource sharedResource, CancellationToken ct = default);
    void UpdateSharedResource(SharedResource sharedResource);
}
