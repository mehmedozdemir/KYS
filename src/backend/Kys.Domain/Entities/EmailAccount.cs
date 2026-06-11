using Kys.Domain.Entities.Base;
using Kys.Domain.Enumerations;

namespace Kys.Domain.Entities;

/// <summary>
/// Giden e-posta (SMTP) hesabı — admin tarafından yönetilir. Birden fazla tanımlanabilir,
/// yalnızca biri aktiftir. Parola AES ile şifreli saklanır.
/// </summary>
public sealed class EmailAccount : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public EmailProvider Provider { get; set; } = EmailProvider.Exchange;

    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public EmailSecurity Security { get; set; } = EmailSecurity.StartTls;

    public string Username { get; set; } = string.Empty;
    public string EncryptedPassword { get; set; } = string.Empty;

    public string FromAddress { get; set; } = string.Empty;
    public string? FromName { get; set; }

    public bool IsActive { get; set; }
}
