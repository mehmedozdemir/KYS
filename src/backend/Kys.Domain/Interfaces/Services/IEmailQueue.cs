namespace Kys.Domain.Interfaces.Services;

/// <summary>Arka planda gönderilecek hazır e-posta mesajı.</summary>
public sealed record EmailMessage(string ToEmail, string? ToName, string Subject, string HtmlBody);

/// <summary>
/// E-postaları istek dışında (arka planda) göndermek için kuyruk. Enqueue anında döner;
/// gönderim bir BackgroundService tarafından yapılır.
/// </summary>
public interface IEmailQueue
{
    void Enqueue(EmailMessage message);
}
