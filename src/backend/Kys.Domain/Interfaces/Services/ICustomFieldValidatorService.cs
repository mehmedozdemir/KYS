using Kys.Domain.Enumerations;

namespace Kys.Domain.Interfaces.Services;

public sealed record CustomFieldValidationError(string FieldKey, string Message);

public interface ICustomFieldValidatorService
{
    Task<IReadOnlyList<CustomFieldValidationError>> ValidateAsync(
        CustomFieldEntityType entityType,
        Dictionary<string, object?> customFields,
        CancellationToken ct = default);
}
