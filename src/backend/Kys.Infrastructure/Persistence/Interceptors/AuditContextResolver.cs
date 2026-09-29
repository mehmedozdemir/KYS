using Kys.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Kys.Infrastructure.Persistence.Interceptors;

/// <summary>
/// Audit kaydının bağlı olduğu iş hiyerarşisini okunabilir bir yola çevirir:
/// "Müşteri / Ürün / Ortam / Kaynak". Yabancı anahtar değerleri çağıran taraftan gelir
/// (değişen entity'nin kendi değerleri ya da reveal kayıtlarında id ile bulunan entity).
/// Silinmiş kayıtların da adı gösterilebilsin diye global query filter'lar yok sayılır.
/// </summary>
internal sealed class AuditContextResolver(DbContext db)
{
    private const string Sep = " / ";

    public async Task<string?> ResolveAsync(string entityType, Func<string, Guid?> fk, CancellationToken ct)
    {
        var path = entityType switch
        {
            // Yeni eklenen kayıt henüz DB'de yok: kendi id'si yerine müşteri + ürün anahtarları
            nameof(CustomerProduct) => Join(
                await CustomerName(fk(nameof(CustomerProduct.CustomerId)), ct),
                await ProductName(fk(nameof(CustomerProduct.ProductId)), ct)),
            nameof(CustomerVpnConfig) => await CustomerName(fk(nameof(CustomerVpnConfig.CustomerId)), ct),
            nameof(CustomerEnvironment) => await CustomerProductPath(fk(nameof(CustomerEnvironment.CustomerProductId)), ct),
            nameof(EnvironmentResource) => await EnvironmentPath(fk(nameof(EnvironmentResource.CustomerEnvironmentId)), ct),
            nameof(CustomerEnvironmentEndpoint) => await EnvironmentPath(fk(nameof(CustomerEnvironmentEndpoint.CustomerEnvironmentId)), ct),
            nameof(ResourceCredential) => await CredentialPath(
                fk(nameof(ResourceCredential.EnvironmentResourceId)),
                fk(nameof(ResourceCredential.SharedResourceId)),
                fk(nameof(ResourceCredential.EndpointUrlId)), ct),
            nameof(PersonalCredential) => await CredentialPath(
                fk(nameof(PersonalCredential.EnvironmentResourceId)),
                fk(nameof(PersonalCredential.SharedResourceId)), null, ct),
            nameof(ProductEndpoint) or nameof(ProductResourceTemplate) or nameof(ProductTeam) or nameof(ProductAssignment)
                => await ProductName(fk("ProductId"), ct),
            nameof(TeamMembership) => await TeamName(fk(nameof(TeamMembership.TeamId)), ct),
            nameof(AccessGrant) => await PersonName(fk(nameof(AccessGrant.PersonId)), ct),
            _ => null
        };
        return path is { Length: > 500 } ? path[..500] : path;
    }

    private static string? Join(params string?[] parts)
    {
        var present = parts.Where(p => !string.IsNullOrEmpty(p)).ToArray();
        return present.Length == 0 ? null : string.Join(Sep, present);
    }

    private async Task<string?> CustomerName(Guid? id, CancellationToken ct) => id is null ? null :
        await db.Set<Customer>().IgnoreQueryFilters().AsNoTracking()
            .Where(c => c.Id == id).Select(c => c.Name).FirstOrDefaultAsync(ct);

    // CustomerProduct: kendi id'si ya da ortamın CustomerProductId'si
    private async Task<string?> CustomerProductPath(Guid? id, CancellationToken ct) => id is null ? null :
        await db.Set<CustomerProduct>().IgnoreQueryFilters().AsNoTracking()
            .Where(cp => cp.Id == id)
            .Select(cp => cp.Customer.Name + Sep + cp.Product.Name).FirstOrDefaultAsync(ct);

    private async Task<string?> EnvironmentPath(Guid? id, CancellationToken ct) => id is null ? null :
        await db.Set<CustomerEnvironment>().IgnoreQueryFilters().AsNoTracking()
            .Where(e => e.Id == id)
            .Select(e => e.CustomerProduct.Customer.Name + Sep + e.CustomerProduct.Product.Name + Sep + e.Name)
            .FirstOrDefaultAsync(ct);

    private async Task<string?> CredentialPath(Guid? resourceId, Guid? sharedId, Guid? endpointUrlId, CancellationToken ct)
    {
        if (resourceId is not null)
            return await db.Set<EnvironmentResource>().IgnoreQueryFilters().AsNoTracking()
                .Where(r => r.Id == resourceId)
                .Select(r => r.CustomerEnvironment.CustomerProduct.Customer.Name + Sep
                           + r.CustomerEnvironment.CustomerProduct.Product.Name + Sep
                           + r.CustomerEnvironment.Name + Sep + r.ProductResourceTemplate.Name)
                .FirstOrDefaultAsync(ct);
        if (endpointUrlId is not null)
            return await db.Set<CustomerEnvironmentEndpoint>().IgnoreQueryFilters().AsNoTracking()
                .Where(ep => ep.Id == endpointUrlId)
                .Select(ep => ep.CustomerEnvironment.CustomerProduct.Customer.Name + Sep
                            + ep.CustomerEnvironment.CustomerProduct.Product.Name + Sep
                            + ep.CustomerEnvironment.Name + Sep + ep.ProductEndpoint.Name)
                .FirstOrDefaultAsync(ct);
        if (sharedId is not null)
        {
            var name = await db.Set<SharedResource>().IgnoreQueryFilters().AsNoTracking()
                .Where(s => s.Id == sharedId).Select(s => s.Name).FirstOrDefaultAsync(ct);
            return name is null ? null : $"Paylaşımlı kaynak{Sep}{name}";
        }
        return null;
    }

    private async Task<string?> ProductName(Guid? id, CancellationToken ct) => id is null ? null :
        await db.Set<Product>().IgnoreQueryFilters().AsNoTracking()
            .Where(p => p.Id == id).Select(p => p.Name).FirstOrDefaultAsync(ct);

    private async Task<string?> TeamName(Guid? id, CancellationToken ct) => id is null ? null :
        await db.Set<Team>().IgnoreQueryFilters().AsNoTracking()
            .Where(t => t.Id == id).Select(t => t.Name).FirstOrDefaultAsync(ct);

    public Task<string?> PersonNameAsync(Guid? id, CancellationToken ct) => PersonName(id, ct);

    private async Task<string?> PersonName(Guid? id, CancellationToken ct) => id is null ? null :
        await db.Set<Person>().IgnoreQueryFilters().AsNoTracking()
            .Where(p => p.Id == id).Select(p => p.FirstName + " " + p.LastName).FirstOrDefaultAsync(ct);
}
