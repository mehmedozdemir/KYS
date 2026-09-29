using Kys.Domain.Entities;

namespace Kys.Domain.Interfaces.Repositories;

public interface IEndpointHealthRepository
{
    Task<EndpointHealth?> GetAsync(Guid customerEnvironmentEndpointId, CancellationToken ct = default);
    Task<IReadOnlyList<EndpointHealth>> GetByEndpointIdsAsync(IReadOnlyCollection<Guid> endpointIds, CancellationToken ct = default);
    void Add(EndpointHealth health);

    /// <summary>İzlenecek endpoint'ler: aktif ortamdaki, aktif ve health URL'i girilmiş olanlar.</summary>
    Task<IReadOnlyList<HealthCheckTarget>> GetTargetsAsync(CancellationToken ct = default);
}

public sealed record HealthCheckTarget(Guid EndpointId, string HealthCheckUrl);
