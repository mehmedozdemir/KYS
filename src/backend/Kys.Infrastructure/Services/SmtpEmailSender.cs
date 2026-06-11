using Kys.Domain.Entities;
using Kys.Domain.Enumerations;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace Kys.Infrastructure.Services;

public sealed class SmtpEmailSender(
    IEmailAccountRepository accountRepository,
    IEncryptionService encryption) : IEmailSender
{
    public async Task SendAsync(string toEmail, string? toName, string subject, string htmlBody, CancellationToken ct = default)
    {
        var account = await accountRepository.GetActiveAsync(ct)
            ?? throw new DomainException("Aktif bir e-posta hesabı tanımlı değil. Mail Ayarları'ndan ekleyin.");
        await SendCoreAsync(account, toEmail, toName, subject, htmlBody, ct);
    }

    public async Task SendWithAsync(Guid accountId, string toEmail, string subject, string htmlBody, CancellationToken ct = default)
    {
        var account = await accountRepository.GetByIdAsync(accountId, ct)
            ?? throw new NotFoundException(nameof(EmailAccount), accountId);
        await SendCoreAsync(account, toEmail, null, subject, htmlBody, ct);
    }

    private async Task SendCoreAsync(EmailAccount account, string toEmail, string? toName, string subject, string htmlBody, CancellationToken ct)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(account.FromName ?? account.FromAddress, account.FromAddress));
        message.To.Add(new MailboxAddress(toName ?? toEmail, toEmail));
        message.Subject = subject;
        message.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();

        var secure = account.Security switch
        {
            EmailSecurity.StartTls => SecureSocketOptions.StartTls,
            EmailSecurity.SslOnConnect => SecureSocketOptions.SslOnConnect,
            _ => SecureSocketOptions.None
        };

        var password = encryption.Decrypt(account.EncryptedPassword);

        using var client = new SmtpClient();
        await client.ConnectAsync(account.Host, account.Port, secure, ct);
        await client.AuthenticateAsync(account.Username, password, ct);
        await client.SendAsync(message, ct);
        await client.DisconnectAsync(true, ct);
    }
}
