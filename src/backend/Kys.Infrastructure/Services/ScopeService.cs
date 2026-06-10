using Kys.Domain.Authorization;
using Kys.Domain.Interfaces.Services;
using Kys.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kys.Infrastructure.Services;

/// <summary>
/// Katman B — kayıt düzeyi yazma yetkisi. Global roller (PlatformAdmin/Director, "*" izni)
/// her şeyi yazabilir. Diğerleri yalnızca: PO'su olduğu ürün VEYA aktif üyesi olduğu ekibe
/// ait ürün kapsamındaki kayıtları yazabilir. (Açık Grant — Faz 4.)
/// </summary>
public sealed class ScopeService(
    AppDbContext db,
    ICurrentUserService currentUser) : IScopeService
{
    public async Task<bool> CanWriteAsync(ScopeTarget target, CancellationToken ct = default)
    {
        if (!currentUser.IsAuthenticated || currentUser.UserId is null)
            return false;

        // Global yazma (PlatformAdmin / Director)
        if (currentUser.HasPermission("*"))
            return true;

        var userId = currentUser.UserId.Value;

        return target.Kind switch
        {
            ScopeKind.Product => await db.Products
                .Where(p => p.Id == target.Id)
                .AnyAsync(p =>
                    p.PoPersonId == userId ||
                    p.Teams.Any(pt => pt.Team.Memberships.Any(m => m.PersonId == userId && m.EndDate == null)),
                    ct),

            ScopeKind.CustomerProduct => await db.CustomerProducts
                .Where(cp => cp.Id == target.Id)
                .AnyAsync(cp =>
                    cp.Product.PoPersonId == userId ||
                    cp.Product.Teams.Any(pt => pt.Team.Memberships.Any(m => m.PersonId == userId && m.EndDate == null)),
                    ct),

            ScopeKind.Environment => await db.CustomerEnvironments
                .Where(e => e.Id == target.Id)
                .AnyAsync(e =>
                    e.CustomerProduct.Product.PoPersonId == userId ||
                    e.CustomerProduct.Product.Teams.Any(pt => pt.Team.Memberships.Any(m => m.PersonId == userId && m.EndDate == null)),
                    ct),

            ScopeKind.EnvironmentResource => await db.EnvironmentResources
                .Where(er => er.Id == target.Id)
                .AnyAsync(er =>
                    er.CustomerEnvironment.CustomerProduct.Product.PoPersonId == userId ||
                    er.CustomerEnvironment.CustomerProduct.Product.Teams.Any(pt => pt.Team.Memberships.Any(m => m.PersonId == userId && m.EndDate == null)),
                    ct),

            _ => false
        };
    }
}
