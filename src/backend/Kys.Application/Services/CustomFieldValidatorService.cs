using System.Text.Json;
using System.Text.RegularExpressions;
using Kys.Domain.Enumerations;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;

namespace Kys.Application.Services;

public sealed class CustomFieldValidatorService(ICustomFieldDefinitionRepository repository)
    : ICustomFieldValidatorService
{
    public async Task<IReadOnlyList<CustomFieldValidationError>> ValidateAsync(
        CustomFieldEntityType entityType,
        Dictionary<string, object?> customFields,
        CancellationToken ct = default)
    {
        var definitions = await repository.GetByEntityTypeAsync(entityType, activeOnly: true, ct);
        var errors = new List<CustomFieldValidationError>();

        foreach (var def in definitions)
        {
            customFields.TryGetValue(def.FieldKey, out var value);

            // Required check
            if (def.IsRequired && IsEmpty(value))
            {
                errors.Add(new CustomFieldValidationError(def.FieldKey, $"'{def.DisplayName}' alanı zorunludur."));
                continue;
            }

            if (IsEmpty(value))
                continue;

            var strValue = GetStringValue(value);

            switch (def.FieldType)
            {
                case CustomFieldType.Select:
                    if (def.SelectOptions is not null && !def.SelectOptions.Contains(strValue, StringComparer.OrdinalIgnoreCase))
                        errors.Add(new CustomFieldValidationError(def.FieldKey,
                            $"'{def.DisplayName}' için geçersiz seçenek: '{strValue}'. Geçerli seçenekler: {string.Join(", ", def.SelectOptions)}."));
                    break;

                case CustomFieldType.Number:
                    if (!double.TryParse(strValue, out var numVal))
                    {
                        errors.Add(new CustomFieldValidationError(def.FieldKey, $"'{def.DisplayName}' sayısal bir değer olmalıdır."));
                    }
                    else
                    {
                        if (TryGetRule<double>(def.ValidationRules, "min", out var min) && numVal < min)
                            errors.Add(new CustomFieldValidationError(def.FieldKey, $"'{def.DisplayName}' en az {min} olmalıdır."));
                        if (TryGetRule<double>(def.ValidationRules, "max", out var max) && numVal > max)
                            errors.Add(new CustomFieldValidationError(def.FieldKey, $"'{def.DisplayName}' en fazla {max} olabilir."));
                    }
                    break;

                case CustomFieldType.Date:
                    if (!DateOnly.TryParse(strValue, out _))
                        errors.Add(new CustomFieldValidationError(def.FieldKey, $"'{def.DisplayName}' geçerli bir tarih olmalıdır (yyyy-MM-dd)."));
                    break;

                case CustomFieldType.Boolean:
                    if (!bool.TryParse(strValue, out _))
                        errors.Add(new CustomFieldValidationError(def.FieldKey, $"'{def.DisplayName}' true veya false olmalıdır."));
                    break;

                case CustomFieldType.Email:
                    if (!strValue.Contains('@') || !strValue.Contains('.'))
                        errors.Add(new CustomFieldValidationError(def.FieldKey, $"'{def.DisplayName}' geçerli bir e-posta adresi olmalıdır."));
                    break;

                case CustomFieldType.Text:
                case CustomFieldType.Url:
                    if (TryGetRule<int>(def.ValidationRules, "min_length", out var minLen) && strValue.Length < minLen)
                        errors.Add(new CustomFieldValidationError(def.FieldKey, $"'{def.DisplayName}' en az {minLen} karakter olmalıdır."));
                    if (TryGetRule<int>(def.ValidationRules, "max_length", out var maxLen) && strValue.Length > maxLen)
                        errors.Add(new CustomFieldValidationError(def.FieldKey, $"'{def.DisplayName}' en fazla {maxLen} karakter olabilir."));
                    if (TryGetRule<string>(def.ValidationRules, "regex", out var pattern) && !Regex.IsMatch(strValue, pattern))
                        errors.Add(new CustomFieldValidationError(def.FieldKey, $"'{def.DisplayName}' beklenen formata uymuyor."));
                    break;
            }
        }

        return errors;
    }

    private static bool IsEmpty(object? value)
        => value is null or "" || (value is JsonElement el && el.ValueKind == JsonValueKind.Null);

    private static string GetStringValue(object? value) => value switch
    {
        JsonElement el => el.ToString(),
        _ => value?.ToString() ?? string.Empty
    };

    private static bool TryGetRule<T>(Dictionary<string, object?> rules, string key, out T result)
    {
        result = default!;
        if (!rules.TryGetValue(key, out var raw) || raw is null)
            return false;

        try
        {
            var str = raw is JsonElement el ? el.ToString() : raw.ToString()!;
            result = (T)Convert.ChangeType(str, typeof(T));
            return true;
        }
        catch
        {
            return false;
        }
    }
}
