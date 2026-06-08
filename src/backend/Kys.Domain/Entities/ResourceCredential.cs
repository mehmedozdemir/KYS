namespace Kys.Domain.Entities;

public sealed class ResourceCredential
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // One of these is set
    public Guid? EnvironmentResourceId { get; set; }
    public Guid? SharedResourceId { get; set; }
    public Guid? EndpointUrlId { get; set; }

    public string FieldKey { get; set; } = string.Empty;
    public string EncryptedValue { get; set; } = string.Empty;
    public string Iv { get; set; } = string.Empty;

    public DateTime? LastRotatedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid? CreatedBy { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public Guid? UpdatedBy { get; set; }

    // Navigation
    public EnvironmentResource? EnvironmentResource { get; set; }
    public SharedResource? SharedResourceNav { get; set; }
    public CustomerEnvironmentEndpoint? EndpointUrl { get; set; }
}
