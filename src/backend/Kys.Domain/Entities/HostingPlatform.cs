namespace Kys.Domain.Entities;

// Bir ortamın üzerinde çalıştığı barındırma platformu (admin tarafından yönetilen katalog).
// Örn. Kubernetes, Docker, Linux Sunucu, Windows Sunucu, AWS, Azure, Google Cloud.
public sealed class HostingPlatform
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Category { get; set; }   // Konteyner | Sunucu | Bulut
    public string? Icon { get; set; }        // PrimeIcons sınıfı (ör. pi-server)
    public string? Color { get; set; }       // hex (#326CE5)
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
