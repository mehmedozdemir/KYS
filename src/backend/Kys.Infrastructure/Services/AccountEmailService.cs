using System.Net;
using Kys.Domain.Interfaces.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Kys.Infrastructure.Services;

public sealed class AccountEmailService(
    IEmailQueue emailQueue,
    IConfiguration configuration,
    ILocalizer localizer,
    ILogger<AccountEmailService> logger) : IAccountEmailService
{
    // Note: rendered in the current request culture at enqueue time; the background
    // sender only delivers the pre-rendered HTML. Recipient language preference is
    // not stored, so the requesting user's culture is used.
    public Task SendPlatformWelcomeAsync(string toEmail, string fullName, string username, string plainPassword, CancellationToken ct = default)
    {
        try
        {
            var html = BuildHtml(
                heading: localizer["email.welcome.heading"],
                fullName: fullName,
                intro: localizer["email.welcome.intro"],
                passwordLabel: localizer["email.welcome.rowTempPassword"],
                username: username,
                plainPassword: plainPassword,
                securityNote: localizer["email.securityNote"]);

            // Kuyruğa at; SMTP gönderimi arka planda yapılır (istek beklemez)
            emailQueue.Enqueue(new EmailMessage(toEmail, fullName, localizer["email.welcome.subject"], html));
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
            var html = BuildHtml(
                heading: localizer["email.reset.heading"],
                fullName: fullName,
                intro: localizer["email.reset.intro"],
                passwordLabel: localizer["email.reset.rowNewPassword"],
                username: username,
                plainPassword: plainPassword,
                securityNote: localizer["email.reset.securityNote"]);

            emailQueue.Enqueue(new EmailMessage(toEmail, fullName, localizer["email.reset.subject"], html));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Şifre sıfırlama e-postası kuyruğa eklenemedi: {Email}", toEmail);
        }

        return Task.CompletedTask;
    }

    private string BuildHtml(
        string heading, string fullName, string intro, string passwordLabel,
        string username, string plainPassword, string securityNote)
    {
        var url = configuration["App:PublicUrl"] ?? "";
        var name = WebUtility.HtmlEncode(fullName);
        var user = WebUtility.HtmlEncode(username);
        var pass = WebUtility.HtmlEncode(plainPassword);
        var greeting = localizer.Get("email.greeting", name);
        var platformLabel = localizer["email.rowPlatform"];
        var usernameLabel = localizer["email.rowUsername"];
        var footer = localizer["email.footer"];

        return $$"""
            <div style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#222;max-width:560px;margin:auto">
              <h2 style="color:#2563eb;margin-bottom:4px">{{heading}}</h2>
              <p>{{greeting}}</p>
              <p>{{intro}}</p>
              <table style="border-collapse:collapse;margin:16px 0;width:100%">
                <tr><td style="padding:8px 12px;background:#f1f5f9;border:1px solid #e2e8f0;font-weight:600;width:140px">{{platformLabel}}</td>
                    <td style="padding:8px 12px;border:1px solid #e2e8f0"><a href="{{url}}" style="color:#2563eb">{{url}}</a></td></tr>
                <tr><td style="padding:8px 12px;background:#f1f5f9;border:1px solid #e2e8f0;font-weight:600">{{usernameLabel}}</td>
                    <td style="padding:8px 12px;border:1px solid #e2e8f0"><code>{{user}}</code></td></tr>
                <tr><td style="padding:8px 12px;background:#f1f5f9;border:1px solid #e2e8f0;font-weight:600">{{passwordLabel}}</td>
                    <td style="padding:8px 12px;border:1px solid #e2e8f0"><code>{{pass}}</code></td></tr>
              </table>
              <p style="color:#b45309;font-size:13px">{{securityNote}}</p>
              <p style="color:#64748b;font-size:12px;margin-top:24px">{{footer}}</p>
            </div>
            """;
    }
}
