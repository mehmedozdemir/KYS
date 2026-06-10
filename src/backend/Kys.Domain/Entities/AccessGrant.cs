using Kys.Domain.Entities.Base;
using Kys.Domain.Enumerations;

namespace Kys.Domain.Entities;

/// <summary>
/// Açık yetki (hibrit istisna) — türetilen kapsam/yeteneğin dışına çıkarmak için verilir.
/// Scope: belirli Product/Team/Customer üzerinde Read/Write. Capability: ör. "customer:create".
/// Süreli olabilir (ExpiresAt). Bkz. docs/AUTHORIZATION.md §4.3.
/// </summary>
public sealed class AccessGrant : BaseEntity
{
    public Guid PersonId { get; set; }
    public GrantKind Kind { get; set; }

    // Kind = Scope
    public GrantScopeType? ScopeType { get; set; }
    public Guid? ScopeId { get; set; }
    public GrantLevel? Level { get; set; }

    // Kind = Capability
    public string? Capability { get; set; }

    public Guid GrantedBy { get; set; }
    public DateTime GrantedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }

    // Navigation
    public Person? Person { get; set; }
}
