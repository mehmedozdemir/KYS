using Kys.Domain.Entities;

namespace Kys.Domain.Interfaces.Repositories;

public interface IEnvironmentRepository
{
    // EnvironmentType
    Task<IReadOnlyList<EnvironmentType>> GetEnvironmentTypesAsync(CancellationToken ct = default);
    Task<EnvironmentType?> GetEnvironmentTypeByIdAsync(Guid id, CancellationToken ct = default);
    Task AddEnvironmentTypeAsync(EnvironmentType environmentType, CancellationToken ct = default);
    void UpdateEnvironmentType(EnvironmentType environmentType);
    void DeleteEnvironmentType(EnvironmentType environmentType);
    Task<int> CountEnvironmentsByTypeAsync(Guid environmentTypeId, CancellationToken ct = default);

    // HostingPlatform
    Task<IReadOnlyList<HostingPlatform>> GetHostingPlatformsAsync(bool activeOnly = true, CancellationToken ct = default);
    Task<HostingPlatform?> GetHostingPlatformByIdAsync(Guid id, CancellationToken ct = default);
    Task AddHostingPlatformAsync(HostingPlatform platform, CancellationToken ct = default);
    void UpdateHostingPlatform(HostingPlatform platform);
    void DeleteHostingPlatform(HostingPlatform platform);
    Task<int> CountEnvironmentsByPlatformAsync(Guid hostingPlatformId, CancellationToken ct = default);

    // CustomerEnvironment
    Task<IReadOnlyList<CustomerEnvironment>> GetByCustomerProductAsync(Guid customerProductId, CancellationToken ct = default);
    Task<CustomerEnvironment?> GetEnvironmentByIdAsync(Guid id, CancellationToken ct = default);
    Task AddCustomerEnvironmentAsync(CustomerEnvironment environment, CancellationToken ct = default);
    void RemoveCustomerEnvironment(CustomerEnvironment environment);
    Task<int> CountEnvironmentsByCustomerProductAsync(Guid customerProductId, CancellationToken ct = default);
    Task<int> CountResourcesByEnvironmentAsync(Guid environmentId, CancellationToken ct = default);

    // EnvironmentResource
    Task<EnvironmentResource?> GetResourceByIdAsync(Guid id, CancellationToken ct = default);
    Task AddEnvironmentResourceAsync(EnvironmentResource resource, CancellationToken ct = default);
    void UpdateEnvironmentResource(EnvironmentResource resource);

    // Credentials
    Task<ResourceCredential?> GetCredentialAsync(Guid environmentResourceId, string fieldKey, CancellationToken ct = default);
    Task<ResourceCredential?> GetEndpointCredentialAsync(Guid endpointUrlId, string fieldKey, CancellationToken ct = default);
    Task<ResourceCredential?> GetSharedCredentialAsync(Guid sharedResourceId, string fieldKey, CancellationToken ct = default);
    Task<IReadOnlyList<ResourceCredential>> GetSharedCredentialsAsync(Guid sharedResourceId, CancellationToken ct = default);
    Task AddCredentialAsync(ResourceCredential credential, CancellationToken ct = default);
    void UpdateCredential(ResourceCredential credential);
    void DeleteCredential(ResourceCredential credential);
    Task<ResourceCredential?> GetCredentialByIdAsync(Guid id, CancellationToken ct = default);

    // CustomerEnvironmentEndpoint
    Task<CustomerEnvironmentEndpoint?> GetEndpointAsync(Guid customerEnvironmentId, Guid productEndpointId, CancellationToken ct = default);
    Task AddEndpointUrlAsync(CustomerEnvironmentEndpoint endpoint, CancellationToken ct = default);
    void UpdateEndpointUrl(CustomerEnvironmentEndpoint endpoint);
    void RemoveEndpointUrl(CustomerEnvironmentEndpoint endpoint);

    // PersonalCredential
    Task<PersonalCredential?> GetPersonalCredentialAsync(Guid ownerPersonId, Guid? environmentResourceId, Guid? sharedResourceId, string fieldKey, CancellationToken ct = default);
    Task<IReadOnlyList<PersonalCredential>> GetMyPersonalCredentialsAsync(Guid ownerPersonId, Guid? environmentResourceId, Guid? sharedResourceId, CancellationToken ct = default);
    Task<PersonalCredential?> GetPersonalCredentialByIdAsync(Guid id, CancellationToken ct = default);
    Task AddPersonalCredentialAsync(PersonalCredential credential, CancellationToken ct = default);
    void UpdatePersonalCredential(PersonalCredential credential);
    void DeletePersonalCredential(PersonalCredential credential);
}
