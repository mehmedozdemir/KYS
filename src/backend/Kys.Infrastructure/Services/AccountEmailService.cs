using System.Net;
using Kys.Domain.Interfaces.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Kys.Infrastructure.Services;

public sealed class AccountEmailService(
    IEmailQueue emailQueue,
    IConfiguration configuration,
    ILogger<AccountEmailService> logger) : IAccountEmailService
{
    public Task SendPlatformWelcomeAsync(string toEmail, string fullName, string username, string plainPassword, CancellationToken ct = default)
    {
        try
        {
            var url = configuration["App:PublicUrl"] ?? "";
            var name = WebUtility.HtmlEncode(fullName);
            var user = WebUtility.HtmlEncode(username);
            var pass = WebUtility.HtmlEncode(plainPassword);

            var html = $$"""
                <div style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#222;max-width:560px;margin:auto">
                  <h2 style="color:#2563eb;margin-bottom:4px">KYS Platformuna Hoş Geldiniz</h2>
                  <p>Merhaba {{name}},</p>
                  <p>Kurumsal Yazılım Yönetim Sistemi (KYS) için bir platform hesabı oluşturuldu.
                     Aşağıdaki bilgilerle giriş yapabilirsiniz.</p>
                  <table style="border-collapse:collapse;margin:16px 0;width:100%">
                    <tr><td style="padding:8px 12px;background:#f1f5f9;border:1px solid #e2e8f0;font-weight:600;width:140px">Platform</td>
                        <td style="padding:8px 12px;border:1px solid #e2e8f0"><a href="{{url}}" style="color:#2563eb">{{url}}</a></td></tr>
                    <tr><td style="padding:8px 12px;background:#f1f5f9;border:1px solid #e2e8f0;font-weight:600">Kullanıcı Adı</td>
                        <td style="padding:8px 12px;border:1px solid #e2e8f0"><code>{{user}}</code></td></tr>
                    <tr><td style="padding:8px 12px;background:#f1f5f9;border:1px solid #e2e8f0;font-weight:600">Geçici Şifre</td>
                        <td style="padding:8px 12px;border:1px solid #e2e8f0"><code>{{pass}}</code></td></tr>
                  </table>
                  <p style="color:#b45309;font-size:13px">Güvenliğiniz için ilk girişten sonra şifrenizi değiştirmeniz önerilir.</p>
                  <p style="color:#64748b;font-size:12px;margin-top:24px">Bu e-posta KYS tarafından otomatik gönderilmiştir.</p>
                </div>
                """;

            // Kuyruğa at; SMTP gönderimi arka planda yapılır (istek beklemez)
            emailQueue.Enqueue(new EmailMessage(toEmail, fullName, "KYS Platform Hesabınız", html));
        }
        catch (Exception ex)
        {
            // Kullanıcı sağlama işlemi e-posta hatası yüzünden başarısız olmamalı
            logger.LogError(ex, "Platform karşılama e-postası kuyruğa eklenemedi: {Email}", toEmail);
        }

        return Task.CompletedTask;
    }

    public Task SendPasswordResetAsync(string toEmail, string fullName, string username, string plainPassword, CancellationToken ct = default)
    {
        try
        {
            var url = configuration["App:PublicUrl"] ?? "";
            var name = WebUtility.HtmlEncode(fullName);
            var user = WebUtility.HtmlEncode(username);
            var pass = WebUtility.HtmlEncode(plainPassword);

            var html = $$"""
                <div style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#222;max-width:560px;margin:auto">
                  <h2 style="color:#2563eb;margin-bottom:4px">Şifreniz Sıfırlandı</h2>
                  <p>Merhaba {{name}},</p>
                  <p>KYS platform hesabınızın şifresi bir yönetici tarafından sıfırlandı.
                     Yeni giriş bilgileriniz aşağıdadır.</p>
                  <table style="border-collapse:collapse;margin:16px 0;width:100%">
                    <tr><td style="padding:8px 12px;background:#f1f5f9;border:1px solid #e2e8f0;font-weight:600;width:140px">Platform</td>
                        <td style="padding:8px 12px;border:1px solid #e2e8f0"><a href="{{url}}" style="color:#2563eb">{{url}}</a></td></tr>
                    <tr><td style="padding:8px 12px;background:#f1f5f9;border:1px solid #e2e8f0;font-weight:600">Kullanıcı Adı</td>
                        <td style="padding:8px 12px;border:1px solid #e2e8f0"><code>{{user}}</code></td></tr>
                    <tr><td style="padding:8px 12px;background:#f1f5f9;border:1px solid #e2e8f0;font-weight:600">Yeni Şifre</td>
                        <td style="padding:8px 12px;border:1px solid #e2e8f0"><code>{{pass}}</code></td></tr>
                  </table>
                  <p style="color:#b45309;font-size:13px">Güvenliğiniz için ilk girişten sonra şifrenizi değiştirmeniz önerilir. Bu işlemi siz talep etmediyseniz yöneticinizle iletişime geçin.</p>
                  <p style="color:#64748b;font-size:12px;margin-top:24px">Bu e-posta KYS tarafından otomatik gönderilmiştir.</p>
                </div>
                """;

            emailQueue.Enqueue(new EmailMessage(toEmail, fullName, "KYS — Şifreniz Sıfırlandı", html));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Şifre sıfırlama e-postası kuyruğa eklenemedi: {Email}", toEmail);
        }

        return Task.CompletedTask;
    }
}
