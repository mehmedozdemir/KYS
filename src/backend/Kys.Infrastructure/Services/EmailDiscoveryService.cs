using DnsClient;
using Kys.Domain.Enumerations;
using Kys.Domain.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace Kys.Infrastructure.Services;

/// <summary>
/// Outlook benzeri otomatik keşif: e-posta alan adından SMTP gönderim ayarlarını tahmin eder.
/// Sıra: bilinen sağlayıcılar → DNS SRV (_submission._tcp) → MX (O365/Google) → tahmin.
/// </summary>
public sealed class EmailDiscoveryService(ILogger<EmailDiscoveryService> logger) : IEmailDiscoveryService
{
    private static readonly Dictionary<string, EmailDiscoveryResult> Known = new(StringComparer.OrdinalIgnoreCase)
    {
        ["gmail.com"]      = new(EmailProvider.Gmail, "smtp.gmail.com", 587, EmailSecurity.StartTls, "Bilinen sağlayıcı: Gmail"),
        ["googlemail.com"] = new(EmailProvider.Gmail, "smtp.gmail.com", 587, EmailSecurity.StartTls, "Bilinen sağlayıcı: Gmail"),
        ["outlook.com"]    = new(EmailProvider.Exchange, "smtp-mail.outlook.com", 587, EmailSecurity.StartTls, "Bilinen sağlayıcı: Outlook.com"),
        ["hotmail.com"]    = new(EmailProvider.Exchange, "smtp-mail.outlook.com", 587, EmailSecurity.StartTls, "Bilinen sağlayıcı: Outlook.com"),
        ["live.com"]       = new(EmailProvider.Exchange, "smtp-mail.outlook.com", 587, EmailSecurity.StartTls, "Bilinen sağlayıcı: Outlook.com"),
        ["office365.com"]  = new(EmailProvider.Exchange, "smtp.office365.com", 587, EmailSecurity.StartTls, "Bilinen sağlayıcı: Office 365"),
        ["yandex.com"]     = new(EmailProvider.Custom, "smtp.yandex.com", 465, EmailSecurity.SslOnConnect, "Bilinen sağlayıcı: Yandex"),
    };

    public async Task<EmailDiscoveryResult> DiscoverAsync(string email, CancellationToken ct = default)
    {
        var at = email.LastIndexOf('@');
        if (at < 0 || at == email.Length - 1)
            throw new ArgumentException("Geçerli bir e-posta adresi giriniz.");

        var domain = email[(at + 1)..].Trim().ToLowerInvariant();

        if (Known.TryGetValue(domain, out var known))
            return known;

        try
        {
            var lookup = new LookupClient();

            // 1) RFC 6186 — SMTP submission SRV kaydı
            var srvResp = await lookup.QueryAsync($"_submission._tcp.{domain}", QueryType.SRV, cancellationToken: ct);
            var srv = srvResp.Answers.SrvRecords().OrderBy(r => r.Priority).ThenByDescending(r => r.Weight).FirstOrDefault();
            if (srv is not null && srv.Target.Value is { Length: > 1 } target)
            {
                var host = target.TrimEnd('.');
                var security = srv.Port == 465 ? EmailSecurity.SslOnConnect : EmailSecurity.StartTls;
                return new EmailDiscoveryResult(EmailProvider.Custom, host, srv.Port, security, "DNS SRV kaydı (_submission)");
            }

            // 2) MX kaydı → Office 365 / Google Workspace tespiti
            var mxResp = await lookup.QueryAsync(domain, QueryType.MX, cancellationToken: ct);
            var mxHosts = mxResp.Answers.MxRecords().Select(r => r.Exchange.Value.ToLowerInvariant()).ToList();

            if (mxHosts.Any(h => h.Contains("mail.protection.outlook.com") || h.Contains("outlook.com")))
                return new EmailDiscoveryResult(EmailProvider.Exchange, "smtp.office365.com", 587, EmailSecurity.StartTls, "Office 365 (MX kaydı)");

            if (mxHosts.Any(h => h.Contains("google.com") || h.Contains("googlemail.com")))
                return new EmailDiscoveryResult(EmailProvider.Gmail, "smtp.gmail.com", 587, EmailSecurity.StartTls, "Google Workspace (MX kaydı)");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "E-posta keşif DNS sorgusu başarısız: {Domain}", domain);
        }

        // 3) Tahmin
        return new EmailDiscoveryResult(EmailProvider.Custom, $"smtp.{domain}", 587, EmailSecurity.StartTls, $"Tahmin (smtp.{domain})");
    }
}
