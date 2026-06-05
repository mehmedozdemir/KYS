using Kys.Domain.Entities.Base;
using Kys.Domain.Enumerations;

namespace Kys.Domain.Entities;

public sealed class Product : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Version { get; set; }
    public ProductType ProductType { get; set; }
    public ProductStatus Status { get; set; } = ProductStatus.Active;

    public Guid? PoPersonId { get; set; }
    public List<string> TechStack { get; set; } = [];
    public string? RepositoryUrl { get; set; }
    public string? DocumentationUrl { get; set; }
    public Dictionary<string, object?> CustomFields { get; set; } = [];

    // Navigation
    public Person? PoPerson { get; set; }
    public ICollection<ProductTeam> Teams { get; set; } = [];
    public ICollection<ProductAssignment> Assignments { get; set; } = [];
    public ICollection<ProductEndpoint> Endpoints { get; set; } = [];
    public ICollection<ProductResourceTemplate> ResourceTemplates { get; set; } = [];
}
