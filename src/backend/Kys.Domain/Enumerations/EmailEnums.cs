namespace Kys.Domain.Enumerations;

/// <summary>Mail sağlayıcı preset'i (host/port önerisi için).</summary>
public enum EmailProvider
{
    Exchange,
    Gmail,
    Custom
}

/// <summary>SMTP bağlantı güvenliği (MailKit SecureSocketOptions karşılığı).</summary>
public enum EmailSecurity
{
    None,
    StartTls,
    SslOnConnect
}
