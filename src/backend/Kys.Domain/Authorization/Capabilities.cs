namespace Kys.Domain.Authorization;

/// <summary>
/// Yetenek (capability) sabitleri — Katman A (aksiyon yetkisi).
/// Biçim: "alan:aksiyon". Roller bu yetenekleri (veya "alan:*" / "*" wildcard) taşır.
/// Kayıt düzeyi kapsam (Katman B) ayrıca handler/sorguda kontrol edilir.
/// </summary>
public static class Capabilities
{
    public const string CustomerRead = "customer:read";
    public const string CustomerCreate = "customer:create";
    public const string CustomerWrite = "customer:write";
    public const string CustomerArchive = "customer:archive";

    public const string ProductRead = "product:read";
    public const string ProductCreate = "product:create";
    public const string ProductWrite = "product:write";
    public const string ProductAssign = "product:assign";

    public const string TeamRead = "team:read";
    public const string TeamCreate = "team:create";
    public const string TeamWrite = "team:write";
    public const string TeamMember = "team:member";

    public const string PersonRead = "person:read";
    public const string PersonCreate = "person:create";
    public const string PersonWrite = "person:write";

    public const string EnvironmentRead = "environment:read";
    public const string EnvironmentWrite = "environment:write";

    public const string CredentialView = "credential:view";
    public const string CredentialWrite = "credential:write";

    public const string KbRead = "kb:read";
    public const string KbWrite = "kb:write";

    public const string AdminConfig = "admin:config";
    public const string AdminUsers = "admin:users";
    public const string AdminAudit = "admin:audit";
}
