using Kys.Domain.Entities.Base;

namespace Kys.Domain.Entities;

public sealed class CustomerEnvironment : AuditableEntity
{
    public Guid CustomerProductId { get; set; }
    public Guid EnvironmentTypeId { get; set; }
    public Guid? HostingPlatformId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public CustomerProduct CustomerProduct { get; set; } = null!;
    public EnvironmentType EnvironmentType { get; set; } = null!;
    public HostingPlatform? HostingPlatform { get; set; }
    public ICollection<EnvironmentResource> Resources { get; set; } = [];
    public ICollection<CustomerEnvironmentEndpoint> Endpoints { get; set; } = [];
}
