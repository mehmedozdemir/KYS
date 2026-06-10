using Kys.Domain.Enumerations;

namespace Kys.Domain.Authorization;

/// <summary>
/// Açık yetki (Grant) kontrolü — Katman B'nin hibrit istisnası.
/// Scope grant kapsamı genişletir, capability grant yeteneği genişletir. Süre (ExpiresAt) dikkate alınır.
/// </summary>
public interface IGrantService
{
    /// <summary>Kullanıcının verilen yeteneğe ait aktif bir capability grant'ı var mı.</summary>
    Task<bool> HasCapabilityAsync(Guid userId, string capability, CancellationToken ct = default);

    /// <summary>Kullanıcının hedef kayıt için (Product/Customer çözümlemesiyle) aktif bir scope grant'ı var mı.</summary>
    Task<bool> HasScopeAsync(Guid userId, ScopeTarget target, GrantLevel level, CancellationToken ct = default);
}
