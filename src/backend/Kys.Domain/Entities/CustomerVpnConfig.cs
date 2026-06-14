using Kys.Domain.Entities.Base;
using Kys.Domain.Enumerations;

namespace Kys.Domain.Entities;

public sealed class CustomerVpnConfig : ISoftDelete
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CustomerId { get; set; }

    // NULL = applies to all environments of this customer
    public Guid? CustomerEnvironmentId { get; set; }

    public string Name { get; set; } = string.Empty;        // "Üretim VPN", "Genel Erişim"
    public VpnType VpnType { get; set; } = VpnType.Other;
    public string ServerHost { get; set; } = string.Empty;  // host or IP
    public int? ServerPort { get; set; }
    public string? Username { get; set; }

    // AES-256 encrypted password
    public string? EncryptedPassword { get; set; }
    public string? PasswordIv { get; set; }

    public string? Notes { get; set; }                      // Markdown connection notes
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid? CreatedBy { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public Guid? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    // Navigation
    public Customer Customer { get; set; } = null!;
    public CustomerEnvironment? CustomerEnvironment { get; set; }
}
