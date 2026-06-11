namespace Kys.Domain.Entities;

/// <summary>
/// Platformu kullanan şirketin kimlik/marka bilgileri — tekil kayıt (singleton).
/// Login, header, mailler ve sayfa başlığında kullanılır.
/// </summary>
public sealed class OrganizationProfile
{
    public static readonly Guid SingletonId = new("11111111-1111-1111-1111-111111111111");

    public Guid Id { get; set; } = SingletonId;

    public string CompanyName { get; set; } = "KYS";
    public string? ShortName { get; set; }
    public string? Website { get; set; }
    public string? Slogan { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? Address { get; set; }
    public string? TaxNumber { get; set; }

    // Logo (DB'de saklanır)
    public byte[]? LogoBytes { get; set; }
    public string? LogoContentType { get; set; }
    public DateTime? LogoUpdatedAt { get; set; }
}
