using Kys.Domain.Enumerations;

namespace Kys.Application.CustomFields;

public interface IHasCustomFields
{
    CustomFieldEntityType EntityType { get; }
    Dictionary<string, object?> CustomFields { get; }
}
