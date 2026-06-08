using Kys.Domain.Interfaces.Services;
using Kys.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kys.Infrastructure.Services;

public sealed class ResourceAuthorizationService(
    AppDbContext db,
    ICurrentUserService currentUser) : IResourceAuthorizationService
{
    public async Task<bool> CanAccessEnvironmentResourceAsync(Guid environmentResourceId, CancellationToken ct = default)
    {
        if (!currentUser.IsAuthenticated || currentUser.UserId is null)
            return false;

        if (currentUser.HasPermission("Resources.ViewAll"))
            return true;

        var userId = currentUser.UserId.Value;

        // User can access if they are on a team assigned to the product that owns this resource
        return await db.EnvironmentResources
            .Where(er => er.Id == environmentResourceId)
            .AnyAsync(er =>
                er.CustomerEnvironment.CustomerProduct.Product.Teams
                    .Any(pt => pt.Team.Memberships
                        .Any(m => m.PersonId == userId && m.EndDate == null)),
                ct);
    }

    public async Task<bool> CanAccessSharedResourceAsync(Guid sharedResourceId, CancellationToken ct = default)
    {
        if (!currentUser.IsAuthenticated || currentUser.UserId is null)
            return false;

        if (currentUser.HasPermission("Resources.ViewAll"))
            return true;

        var userId = currentUser.UserId.Value;

        return await db.EnvironmentResources
            .Where(er => er.SharedResourceId == sharedResourceId)
            .AnyAsync(er =>
                er.CustomerEnvironment.CustomerProduct.Product.Teams
                    .Any(pt => pt.Team.Memberships
                        .Any(m => m.PersonId == userId && m.EndDate == null)),
                ct);
    }

    public async Task<bool> CanAccessEndpointUrlAsync(Guid endpointUrlId, CancellationToken ct = default)
    {
        if (!currentUser.IsAuthenticated || currentUser.UserId is null)
            return false;

        if (currentUser.HasPermission("Resources.ViewAll"))
            return true;

        var userId = currentUser.UserId.Value;

        return await db.CustomerEnvironmentEndpoints
            .Where(ep => ep.Id == endpointUrlId)
            .AnyAsync(ep =>
                ep.CustomerEnvironment.CustomerProduct.Product.Teams
                    .Any(pt => pt.Team.Memberships
                        .Any(m => m.PersonId == userId && m.EndDate == null)),
                ct);
    }
}
