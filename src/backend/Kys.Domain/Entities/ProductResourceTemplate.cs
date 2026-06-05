namespace Kys.Domain.Entities;

public sealed class ProductResourceTemplate
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductId { get; set; }
    public Guid ResourceTypeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsRequired { get; set; } = true;
    public int SortOrder { get; set; }
    public bool CanBeShared { get; set; }

    // Navigation
    public Product Product { get; set; } = null!;
    public ResourceType ResourceType { get; set; } = null!;
}
