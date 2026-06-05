namespace Kys.Domain.Entities;

public sealed class EnvironmentType
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public string? Color { get; set; }  // hex (#EF4444)
    public bool IsActive { get; set; } = true;
}
