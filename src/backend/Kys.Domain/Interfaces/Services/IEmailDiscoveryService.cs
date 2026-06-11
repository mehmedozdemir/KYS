using Kys.Domain.Enumerations;

namespace Kys.Domain.Interfaces.Services;

/// <summary>E-posta adresinden SMTP gönderim ayarlarını otomatik bulma sonucu.</summary>
public sealed record EmailDiscoveryResult(
    EmailProvider Provider,
    string Host,
    int Port,
    EmailSecurity Security,
    string Source); // ayarın nasıl bulunduğu (kullanıcıya bilgi)

public interface IEmailDiscoveryService
{
    Task<EmailDiscoveryResult> DiscoverAsync(string email, CancellationToken ct = default);
}
