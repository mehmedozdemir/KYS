using Kys.Domain.Entities.Base;

namespace Kys.Domain.Entities;

public sealed class SharedResource : AuditableEntity
{
    public Guid ResourceTypeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? EnvironmentScope { get; set; }  // Dev | Test | Prod | All
    public Dictionary<string, object?> ConnectionFields { get; set; } = [];

    // Navigation
    public ResourceType ResourceType { get; set; } = null!;
}
