namespace Kys.Domain.Authorization;

/// <summary>
/// Kapsam (scope) hedefinin türü — Katman B (kayıt düzeyi yetki).
/// </summary>
public enum ScopeKind
{
    Product,
    Environment,
    CustomerProduct,
    EnvironmentResource
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
    Task<bool> CanWriteAsync(ScopeTarget target, CancellationToken ct = default);
}
