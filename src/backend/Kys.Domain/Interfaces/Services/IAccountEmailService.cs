namespace Kys.Domain.Interfaces.Services;

public interface IAccountEmailService
{
    /// <summary>Platform hesabı açılan/atanan kişiye karşılama e-postası (best-effort; hata kullanıcı işlemini bozmaz).</summary>
    Task SendPlatformWelcomeAsync(string toEmail, string fullName, string username, string plainPassword, CancellationToken ct = default);
}
