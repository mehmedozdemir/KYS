using Kys.Domain.Entities;
using Kys.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Kys.Infrastructure.Persistence.Repositories;

public sealed class EndpointHealthRepository(AppDbContext db) : IEndpointHealthRepository
{
    public Task<EndpointHealth?> GetAsync(Guid customerEnvironmentEndpointId, CancellationToken ct = default)
        => db.EndpointHealths.FirstOrDefaultAsync(h => h.CustomerEnvironmentEndpointId == customerEnvironmentEndpointId, ct);

    public async Task<IReadOnlyList<EndpointHealth>> GetByEndpointIdsAsync(IReadOnlyCollection<Guid> endpointIds, CancellationToken ct = default)
    {
        if (endpointIds.Count == 0) return [];
        return await db.EndpointHealths.AsNoTracking()
            .Where(h => endpointIds.Contains(h.CustomerEnvironmentEndpointId))
            .ToListAsync(ct);
    }

    public void Add(EndpointHealth health) => db.EndpointHealths.Add(health);

    public async Task<IReadOnlyList<HealthCheckTarget>> GetTargetsAsync(CancellationToken ct = default)
        => await db.Set<CustomerEnvironmentEndpoint>().AsNoTracking()
            .Where(e => e.IsActive && e.HealthCheckUrl != null && e.HealthCheckUrl != "" && e.CustomerEnvironment.IsActive)
            .Select(e => new HealthCheckTarget(e.Id, e.HealthCheckUrl!))
            .ToListAsync(ct);
}
