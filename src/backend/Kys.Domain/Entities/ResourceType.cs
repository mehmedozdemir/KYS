namespace Kys.Domain.Entities;

public sealed class ResourceType
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? Icon { get; set; }
    public string? Description { get; set; }
    public Dictionary<string, object?> FieldSchema { get; set; } = [];
    public bool IsActive { get; set; } = true;
}
