using Kys.Domain.Entities.Base;

namespace Kys.Domain.Entities;

public sealed class EnvironmentResource : AuditableEntity
{
    public Guid CustomerEnvironmentId { get; set; }
    public Guid ProductResourceTemplateId { get; set; }
    public bool IsShared { get; set; }
    public Guid? SharedResourceId { get; set; }
    public Dictionary<string, object?> ConnectionFields { get; set; } = [];
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public CustomerEnvironment CustomerEnvironment { get; set; } = null!;
    public ProductResourceTemplate ProductResourceTemplate { get; set; } = null!;
    public SharedResource? SharedResource { get; set; }
    public ICollection<ResourceCredential> Credentials { get; set; } = [];
}
