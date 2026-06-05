namespace Kys.Domain.Interfaces.Services;

public interface IResourceAuthorizationService
{
    Task<bool> CanAccessEnvironmentResourceAsync(Guid environmentResourceId, CancellationToken ct = default);
    Task<bool> CanAccessSharedResourceAsync(Guid sharedResourceId, CancellationToken ct = default);
}
