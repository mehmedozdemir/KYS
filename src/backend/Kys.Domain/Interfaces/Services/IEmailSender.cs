namespace Kys.Domain.Interfaces.Services;

public interface IEmailSender
{
    /// <summary>Aktif e-posta hesabıyla HTML e-posta gönderir. Aktif hesap yoksa istisna atar.</summary>
    Task SendAsync(string toEmail, string? toName, string subject, string htmlBody, CancellationToken ct = default);

    /// <summary>Belirli bir hesap + açık parola ile test gönderimi (kaydetmeden doğrulama için).</summary>
    Task SendWithAsync(Guid accountId, string toEmail, string subject, string htmlBody, CancellationToken ct = default);
}
