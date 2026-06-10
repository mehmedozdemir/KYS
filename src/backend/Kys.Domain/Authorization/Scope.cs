namespace Kys.Domain.Authorization;

/// <summary>
/// Kapsam (scope) hedefinin türü — Katman B (kayıt düzeyi yetki).
/// </summary>
public enum ScopeKind
{
    Product,
    Environment,
    CustomerProduct,
    EnvironmentResource,
    Customer
}

/// <summary>Yazma yetkisinin kontrol edileceği kayıt (tür + id).</summary>
public readonly record struct ScopeTarget(ScopeKind Kind, Guid Id);

/// <summary>
/// Bu marker'ı taşıyan komutlar, çalıştırılmadan önce <see cref="ScopeTarget"/>
/// üzerinde yazma yetkisi (Katman B) açısından kontrol edilir.
/// </summary>
public interface IScopedCommand
{
    ScopeTarget ScopeTarget { get; }
}

/// <summary>
/// Kayıt düzeyi yazma yetkisi servisi. Global roller (PlatformAdmin/Director) her şeyi
/// yazabilir; diğerleri yalnızca sahibi/üyesi olduğu ürünün kapsamındaki kayıtları.
/// </summary>
public interface IScopeService
{
    /// <summary>Geçerli kullanıcının id'si (yoksa null).</summary>
    Guid? CurrentUserId { get; }

    /// <summary>Global okuma yetkisi var mı (Admin/Director "*" veya CTO "scope:global").</summary>
    bool HasGlobalReadAccess();

    /// <summary>Kayıt üzerinde yazma yetkisi (Katman B).</summary>
    Task<bool> CanWriteAsync(ScopeTarget target, CancellationToken ct = default);

    /// <summary>Kayıt üzerinde okuma yetkisi (global okuma VEYA kapsam: PO/ekip üyeliği/atama).</summary>
    Task<bool> CanReadAsync(ScopeTarget target, CancellationToken ct = default);
}
