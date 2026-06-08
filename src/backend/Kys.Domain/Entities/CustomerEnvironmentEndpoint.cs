using Kys.Domain.Entities.Base;
using Kys.Domain.Enumerations;

namespace Kys.Domain.Entities;

public sealed class CustomerEnvironmentEndpoint : AuditableEntity
{
    public Guid CustomerEnvironmentId { get; set; }
    public Guid ProductEndpointId { get; set; }
    public string BaseUrl { get; set; } = string.Empty;
    public string? SwaggerUrl { get; set; }
    public string? HealthCheckUrl { get; set; }
    public AuthType? AuthType { get; set; }
    public Dictionary<string, object?> AuthConfig { get; set; } = [];
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }

    // Navigation
    public CustomerEnvironment CustomerEnvironment { get; set; } = null!;
    public ProductEndpoint ProductEndpoint { get; set; } = null!;
    public ICollection<ResourceCredential> Credentials { get; set; } = [];
}
