using System.Text.Json;
using System.Text.RegularExpressions;
using Kys.Domain.Enumerations;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;

namespace Kys.Application.Services;

public sealed class CustomFieldValidatorService(
    ICustomFieldDefinitionRepository repository,
    ILocalizer localizer)
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
                errors.Add(new CustomFieldValidationError(def.FieldKey, localizer.Get("val.cf.required", def.DisplayName)));
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
                            localizer.Get("val.cf.invalidOption", def.DisplayName, strValue, string.Join(", ", def.SelectOptions))));
                    break;

                case CustomFieldType.Number:
                    if (!double.TryParse(strValue, out var numVal))
                    {
                        errors.Add(new CustomFieldValidationError(def.FieldKey, localizer.Get("val.cf.number", def.DisplayName)));
                    }
                    else
                    {
                        if (TryGetRule<double>(def.ValidationRules, "min", out var min) && numVal < min)
                            errors.Add(new CustomFieldValidationError(def.FieldKey, localizer.Get("val.cf.min", def.DisplayName, min)));
                        if (TryGetRule<double>(def.ValidationRules, "max", out var max) && numVal > max)
                            errors.Add(new CustomFieldValidationError(def.FieldKey, localizer.Get("val.cf.max", def.DisplayName, max)));
                    }
                    break;

                case CustomFieldType.Date:
                    if (!DateOnly.TryParse(strValue, out _))
                        errors.Add(new CustomFieldValidationError(def.FieldKey, localizer.Get("val.cf.date", def.DisplayName)));
                    break;

                case CustomFieldType.Boolean:
                    if (!bool.TryParse(strValue, out _))
                        errors.Add(new CustomFieldValidationError(def.FieldKey, localizer.Get("val.cf.boolean", def.DisplayName)));
                    break;

                case CustomFieldType.Email:
                    if (!strValue.Contains('@') || !strValue.Contains('.'))
                        errors.Add(new CustomFieldValidationError(def.FieldKey, localizer.Get("val.cf.email", def.DisplayName)));
                    break;

                case CustomFieldType.Text:
                case CustomFieldType.Url:
                    if (TryGetRule<int>(def.ValidationRules, "min_length", out var minLen) && strValue.Length < minLen)
                        errors.Add(new CustomFieldValidationError(def.FieldKey, localizer.Get("val.cf.minLength", def.DisplayName, minLen)));
                    if (TryGetRule<int>(def.ValidationRules, "max_length", out var maxLen) && strValue.Length > maxLen)
                        errors.Add(new CustomFieldValidationError(def.FieldKey, localizer.Get("val.cf.maxLength", def.DisplayName, maxLen)));
                    if (TryGetRule<string>(def.ValidationRules, "regex", out var pattern) && !Regex.IsMatch(strValue, pattern))
                        errors.Add(new CustomFieldValidationError(def.FieldKey, localizer.Get("val.cf.regex", def.DisplayName)));
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
