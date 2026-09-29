using Kys.Domain.Entities;
using Kys.Domain.Entities.Base;
using Kys.Domain.Interfaces.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Kys.Infrastructure.Persistence.Interceptors;

/// <summary>
/// Her Create/Update/Delete işlemini audit_logs tablosuna, aynı SaveChanges içinde yazar.
/// SoftDeleteInterceptor'dan SONRA çalışmalıdır: soft-delete edilen kayıtlar Modified
/// (IsDeleted=true) olarak gelir ve "Deleted" aksiyonuyla loglanır.
/// </summary>
public sealed class AuditLogInterceptor(ICurrentUserService currentUserService) : SaveChangesInterceptor
{
    private const string Masked = "***";

    // Asla açık değeriyle audit'e yazılmayacak alanlar.
    private static readonly HashSet<string> SensitiveProperties = new(StringComparer.Ordinal)
    {
        "PasswordHash", "RefreshToken", "EncryptedValue", "EncryptedPassword",
        "PasswordIv", "Iv", "SecurityStamp", "ConcurrencyStamp"
    };

    // Değeri anlamsız/çok büyük; tamamen dışarıda bırakılır.
    private static readonly HashSet<string> ExcludedProperties = new(StringComparer.Ordinal)
    {
        "LogoBytes"
    };

    // Yalnızca bu alanlar değiştiyse kayıt audit'e yazılmaz (giriş, token yenileme, zaman damgası gürültüsü).
    private static readonly HashSet<string> NoiseProperties = new(StringComparer.Ordinal)
    {
        "UpdatedAt", "UpdatedBy", "LastLoginAt", "RefreshToken", "RefreshTokenExpiresAt", "FailedLoginCount"
    };

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        WriteAuditEntries(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        var pending = WriteAuditEntries(eventData.Context);
        if (eventData.Context is not null)
            await ResolveContextsAsync(eventData.Context, pending, cancellationToken);
        return await base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    // Bağlam (Müşteri / Ürün / Ortam / Kaynak) yalnızca async yolda çözülür; uygulama SaveChangesAsync kullanır.
    private static async Task ResolveContextsAsync(
        DbContext context, List<(AuditLog Log, EntityEntry? Entry)> pending, CancellationToken ct)
    {
        var resolver = new AuditContextResolver(context);
        foreach (var (log, entry) in pending)
        {
            if (log.Context is not null) continue;
            var source = entry ?? await FindTrackedOrStoredAsync(context, log.EntityType, log.EntityId, ct);
            if (source is null) continue;
            log.Context = await resolver.ResolveAsync(log.EntityType, prop => ReadGuid(source, prop), ct);
            // Kendi adı olmayan kişi ilişkileri (ekip üyeliği, ürün ataması, erişim yetkisi) → kişinin adı
            log.EntityName ??= await resolver.PersonNameAsync(ReadGuid(source, "PersonId") ?? ReadGuid(source, "OwnerPersonId"), ct);
        }
    }

    // Handler'ların eklediği audit kayıtları (ör. CredentialRevealed) yalnızca tip + id taşır.
    private static async Task<EntityEntry?> FindTrackedOrStoredAsync(DbContext context, string entityType, Guid id, CancellationToken ct)
    {
        var clr = context.Model.GetEntityTypes().FirstOrDefault(t => t.ClrType.Name == entityType)?.ClrType;
        if (clr is null) return null;
        var entity = await context.FindAsync(clr, [id], ct);
        return entity is null ? null : context.Entry(entity);
    }

    private static Guid? ReadGuid(EntityEntry entry, string property) =>
        entry.Metadata.FindProperty(property) is null ? null : entry.Property(property).CurrentValue as Guid?;

    private List<(AuditLog Log, EntityEntry? Entry)> WriteAuditEntries(DbContext? context)
    {
        var pending = new List<(AuditLog, EntityEntry?)>();
        if (context is null) return pending;

        var userId = currentUserService.UserId;
        var ip = currentUserService.IpAddress;
        var now = DateTime.UtcNow;

        // Handler'ların doğrudan eklediği audit kayıtlarına (ör. CredentialRevealed) IP'yi tamamla.
        foreach (var existing in context.ChangeTracker.Entries<AuditLog>().Where(e => e.State == EntityState.Added))
        {
            existing.Entity.IpAddress ??= ip;
            pending.Add((existing.Entity, null));
        }

        var logs = new List<AuditLog>();
        foreach (var entry in context.ChangeTracker.Entries().ToList())
        {
            if (entry.Entity is AuditLog) continue;
            if (entry.State is not (EntityState.Added or EntityState.Modified or EntityState.Deleted)) continue;

            var entityId = GetGuidKey(entry);
            if (entityId is null) continue; // bileşik anahtarlı ilişki tabloları (KbArticleTag, PersonSystemRole)

            var log = BuildLog(entry, entityId.Value);
            if (log is null) continue;

            log.ChangedBy = userId;
            log.ChangedAt = now;
            log.IpAddress = ip;
            logs.Add(log);
            pending.Add((log, entry));
        }

        if (logs.Count > 0)
            context.Set<AuditLog>().AddRange(logs);
        return pending;
    }

    private static AuditLog? BuildLog(EntityEntry entry, Guid entityId)
    {
        var entityType = entry.Metadata.ClrType.Name;
        var name = GetDisplayName(entry);

        switch (entry.State)
        {
            case EntityState.Added:
                return new AuditLog
                {
                    EntityType = entityType, EntityId = entityId, EntityName = name, Action = "Created",
                    NewValues = Snapshot(entry, p => p.CurrentValue)
                };

            case EntityState.Deleted:
                return new AuditLog
                {
                    EntityType = entityType, EntityId = entityId, EntityName = name, Action = "Deleted",
                    OldValues = Snapshot(entry, p => p.OriginalValue)
                };

            default: // Modified
                var changed = entry.Properties
                    .Where(p => p.IsModified && !Equals(p.OriginalValue, p.CurrentValue))
                    .Where(p => !ExcludedProperties.Contains(p.Metadata.Name))
                    .ToList();

                if (changed.All(p => NoiseProperties.Contains(p.Metadata.Name)))
                    return null;

                var action = "Updated";
                if (entry.Entity is ISoftDelete softDelete && changed.Any(p => p.Metadata.Name == nameof(ISoftDelete.IsDeleted)))
                    action = softDelete.IsDeleted ? "Deleted" : "Restored";

                var old = new Dictionary<string, object?>();
                var @new = new Dictionary<string, object?>();
                foreach (var p in changed.Where(p => !NoiseProperties.Contains(p.Metadata.Name)))
                {
                    var key = p.Metadata.Name;
                    var sensitive = SensitiveProperties.Contains(key);
                    old[key] = sensitive ? Masked : p.OriginalValue;
                    @new[key] = sensitive ? Masked : p.CurrentValue;
                }

                return new AuditLog
                {
                    EntityType = entityType, EntityId = entityId, EntityName = name, Action = action,
                    OldValues = old, NewValues = @new
                };
        }
    }

    private static Dictionary<string, object?> Snapshot(EntityEntry entry, Func<PropertyEntry, object?> value)
    {
        var dict = new Dictionary<string, object?>();
        foreach (var p in entry.Properties)
        {
            var key = p.Metadata.Name;
            if (ExcludedProperties.Contains(key)) continue;
            dict[key] = SensitiveProperties.Contains(key) ? Masked : value(p);
        }
        return dict;
    }

    private static Guid? GetGuidKey(EntityEntry entry)
    {
        var key = entry.Metadata.FindPrimaryKey();
        if (key is null || key.Properties.Count != 1) return null;
        return entry.Property(key.Properties[0].Name).CurrentValue as Guid?;
    }

    private static string? GetDisplayName(EntityEntry entry)
    {
        string? Get(string prop) =>
            entry.Metadata.FindProperty(prop) is null ? null : entry.Property(prop).CurrentValue?.ToString();

        var first = Get("FirstName");
        var last = Get("LastName");
        if (first is not null || last is not null)
            return $"{first} {last}".Trim();

        var name = Get("Name") ?? Get("Title") ?? Get("CompanyName") ?? Get("FieldKey") ?? Get("Code") ?? Get("BaseUrl");
        return name is { Length: > 300 } ? name[..300] : name;
    }
}
