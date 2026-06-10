using Kys.Domain.Authorization;
using Kys.Domain.Enumerations;
using Kys.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kys.Infrastructure.Services;

/// <summary>
/// Açık yetki (Grant) kontrolü. Faz 4a: Product ve Customer scope grant'ları + capability grant.
/// (Team grant'ının ürün devralımı ileride.)
/// </summary>
public sealed class GrantService(AppDbContext db) : IGrantService
{
    public Task<bool> HasCapabilityAsync(Guid userId, string capability, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        return db.AccessGrants.AnyAsync(g =>
            g.PersonId == userId &&
            g.Kind == GrantKind.Capability &&
            g.Capability == capability &&
            (g.ExpiresAt == null || g.ExpiresAt > now), ct);
    }

    public async Task<bool> HasScopeAsync(Guid userId, ScopeTarget target, GrantLevel level, CancellationToken ct = default)
    {
        // Hedefi sahibi ürüne (veya müşteriye) çöz
        Guid? productId = target.Kind switch
        {
            ScopeKind.Product => target.Id,
            ScopeKind.CustomerProduct => await db.CustomerProducts
                .Where(cp => cp.Id == target.Id).Select(cp => (Guid?)cp.ProductId).FirstOrDefaultAsync(ct),
            ScopeKind.Environment => await db.CustomerEnvironments
                .Where(e => e.Id == target.Id).Select(e => (Guid?)e.CustomerProduct.ProductId).FirstOrDefaultAsync(ct),
            ScopeKind.EnvironmentResource => await db.EnvironmentResources
                .Where(er => er.Id == target.Id).Select(er => (Guid?)er.CustomerEnvironment.CustomerProduct.ProductId).FirstOrDefaultAsync(ct),
            _ => null
        };

        var now = DateTime.UtcNow;
        var active = db.AccessGrants.Where(g =>
            g.PersonId == userId &&
            g.Kind == GrantKind.Scope &&
            (g.ExpiresAt == null || g.ExpiresAt > now) &&
            // Write grant her şeyi; Read grant yalnızca okuma talebini karşılar
            (g.Level == GrantLevel.Write || g.Level == level));

        if (productId is { } pid)
            return await active.AnyAsync(g => g.ScopeType == GrantScopeType.Product && g.ScopeId == pid, ct);

        if (target.Kind == ScopeKind.Customer)
            return await active.AnyAsync(g => g.ScopeType == GrantScopeType.Customer && g.ScopeId == target.Id, ct);

        return false;
    }
}
