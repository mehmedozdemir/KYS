using Kys.Domain.Entities;

namespace Kys.Domain.Interfaces.Repositories;

public interface IEnvironmentRepository
{
    // EnvironmentType
    Task<IReadOnlyList<EnvironmentType>> GetEnvironmentTypesAsync(CancellationToken ct = default);
    Task<EnvironmentType?> GetEnvironmentTypeByIdAsync(Guid id, CancellationToken ct = default);
    Task AddEnvironmentTypeAsync(EnvironmentType environmentType, CancellationToken ct = default);

    // CustomerEnvironment
    Task<IReadOnlyList<CustomerEnvironment>> GetByCustomerProductAsync(Guid customerProductId, CancellationToken ct = default);
    Task<CustomerEnvironment?> GetEnvironmentByIdAsync(Guid id, CancellationToken ct = default);
    Task AddCustomerEnvironmentAsync(CustomerEnvironment environment, CancellationToken ct = default);

    // EnvironmentResource
    Task<EnvironmentResource?> GetResourceByIdAsync(Guid id, CancellationToken ct = default);
    Task AddEnvironmentResourceAsync(EnvironmentResource resource, CancellationToken ct = default);
    void UpdateEnvironmentResource(EnvironmentResource resource);

    // Credentials
    Task<ResourceCredential?> GetCredentialAsync(Guid environmentResourceId, string fieldKey, CancellationToken ct = default);
    Task AddCredentialAsync(ResourceCredential credential, CancellationToken ct = default);
    void UpdateCredential(ResourceCredential credential);
    Task<ResourceCredential?> GetCredentialByIdAsync(Guid id, CancellationToken ct = default);

    // CustomerEnvironmentEndpoint
    Task<CustomerEnvironmentEndpoint?> GetEndpointAsync(Guid customerEnvironmentId, Guid productEndpointId, CancellationToken ct = default);
    Task AddEndpointUrlAsync(CustomerEnvironmentEndpoint endpoint, CancellationToken ct = default);
    void UpdateEndpointUrl(CustomerEnvironmentEndpoint endpoint);
}
