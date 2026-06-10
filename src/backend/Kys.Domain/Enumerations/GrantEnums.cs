namespace Kys.Domain.Enumerations;

/// <summary>Grant türü: belirli bir kayda erişim (Scope) ya da bir yetenek (Capability).</summary>
public enum GrantKind
{
    Scope,
    Capability
}

/// <summary>Scope grant'ın hedef kayıt türü.</summary>
public enum GrantScopeType
{
    Product,
    Team,
    Customer
}

/// <summary>Scope grant erişim seviyesi (Write, Read'i de kapsar).</summary>
public enum GrantLevel
{
    Read,
    Write
}
