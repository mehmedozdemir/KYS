using Kys.Domain.Enumerations;

namespace Kys.Domain.Entities;

public sealed class CustomFieldDefinition
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public CustomFieldEntityType EntityType { get; set; }
    public string FieldKey { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public CustomFieldType FieldType { get; set; }
    public bool IsRequired { get; set; }
    public string? DefaultValue { get; set; }
    public List<string>? SelectOptions { get; set; }
    public Dictionary<string, object?> ValidationRules { get; set; } = [];
    public int DisplayOrder { get; set; }
    public string? GroupName { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
