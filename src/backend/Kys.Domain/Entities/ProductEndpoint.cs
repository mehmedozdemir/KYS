using Kys.Domain.Entities.Base;
using Kys.Domain.Enumerations;

namespace Kys.Domain.Entities;

public sealed class ProductEndpoint : AuditableEntity
{
    public Guid ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public EndpointType EndpointType { get; set; }
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public string? DefaultBaseUrl { get; set; }
    public string? SwaggerUrl { get; set; }
    public string? HealthCheckUrl { get; set; }
    public AuthType DefaultAuthType { get; set; } = AuthType.None;
    public Dictionary<string, object?> AuthConfigTemplate { get; set; } = [];

    // Navigation
    public Product Product { get; set; } = null!;
}
