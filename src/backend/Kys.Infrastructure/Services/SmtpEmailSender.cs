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

        // 20 sn'de bir yanıt gelmezse hızlı başarısız ol (120 sn askıda kalmasın)
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeoutCts.CancelAfter(TimeSpan.FromSeconds(20));
        var token = timeoutCts.Token;

        using var client = new SmtpClient { Timeout = 20000 };
        try
        {
            await client.ConnectAsync(account.Host, account.Port, secure, token);
            await client.AuthenticateAsync(account.Username, password, token);
            await client.SendAsync(message, token);
            await client.DisconnectAsync(true, token);
        }
        catch (OperationCanceledException) when (timeoutCts.IsCancellationRequested && !ct.IsCancellationRequested)
        {
            throw new DomainException(
                $"SMTP bağlantısı zaman aşımına uğradı ({account.Host}:{account.Port}). " +
                "Sunucu/port yanlış olabilir (SMTP için genelde 587/STARTTLS ya da 465/SSL — 443 SMTP değildir) veya erişim engelli.");
        }
        catch (System.Net.Sockets.SocketException ex)
        {
            throw new DomainException(
                $"SMTP sunucusuna bağlanılamadı ({account.Host}:{account.Port}). " +
                $"Sunucu adresi/port hatalı olabilir veya erişim engelli. ({ex.Message})");
        }
        catch (MailKit.Security.SslHandshakeException)
        {
            throw new DomainException(
                $"TLS/SSL el sıkışma hatası ({account.Host}:{account.Port}). " +
                "Güvenlik ayarını ve portu kontrol edin (STARTTLS→587, SSL→465).");
        }
        catch (MailKit.Security.AuthenticationException)
        {
            throw new DomainException("Kimlik doğrulama başarısız: kullanıcı adı veya parola hatalı (O365'te SMTP AUTH kapalı olabilir / MFA varsa uygulama şifresi gerekir).");
        }
        catch (MailKit.Net.Smtp.SmtpCommandException ex)
        {
            throw new DomainException($"SMTP sunucusu reddetti: {ex.Message}");
        }
        catch (MailKit.Net.Smtp.SmtpProtocolException ex)
        {
            throw new DomainException($"SMTP protokol hatası: {ex.Message} (yanlış porta bağlanıyor olabilirsiniz).");
        }
        catch (Exception ex)
        {
            throw new DomainException($"E-posta gönderilemedi ({account.Host}:{account.Port}): {ex.Message}");
        }
    }
}
