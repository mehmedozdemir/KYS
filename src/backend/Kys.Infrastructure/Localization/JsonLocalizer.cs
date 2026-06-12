using System.Globalization;
using System.Text.Json;
using Kys.Domain.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace Kys.Infrastructure.Localization;

/// <summary>
/// Lightweight JSON-backed localizer. Loads backend.{tr,en}.json once at startup
/// (flat dotted-key dictionaries) and resolves by <see cref="CultureInfo.CurrentUICulture"/>.
/// Mirrors the frontend's tr.json/en.json approach.
/// </summary>
public sealed class JsonLocalizer : ILocalizer
{
    private const string DefaultLanguage = "tr";
    private readonly IReadOnlyDictionary<string, IReadOnlyDictionary<string, string>> _resources;

    public JsonLocalizer(ILogger<JsonLocalizer> logger)
    {
        var dir = Path.Combine(AppContext.BaseDirectory, "Localization", "Resources");
        var map = new Dictionary<string, IReadOnlyDictionary<string, string>>();

        foreach (var lang in new[] { "tr", "en" })
        {
            var path = Path.Combine(dir, $"backend.{lang}.json");
            try
            {
                if (File.Exists(path))
                {
                    var json = File.ReadAllText(path);
                    var dict = JsonSerializer.Deserialize<Dictionary<string, string>>(json)
                               ?? new Dictionary<string, string>();
                    map[lang] = dict;
                }
                else
                {
                    logger.LogWarning("Localization resource not found: {Path}", path);
                    map[lang] = new Dictionary<string, string>();
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to load localization resource: {Path}", path);
                map[lang] = new Dictionary<string, string>();
            }
        }

        _resources = map;
    }

    private string CurrentLanguage()
    {
        var lang = CultureInfo.CurrentUICulture.TwoLetterISOLanguageName.ToLowerInvariant();
        return _resources.ContainsKey(lang) ? lang : DefaultLanguage;
    }

    public string this[string key]
    {
        get
        {
            if (string.IsNullOrEmpty(key)) return key;

            var lang = CurrentLanguage();
            if (_resources.TryGetValue(lang, out var dict) && dict.TryGetValue(key, out var value))
                return value;

            // Fall back to default language, then to the key itself (literal passthrough).
            if (lang != DefaultLanguage
                && _resources.TryGetValue(DefaultLanguage, out var fallback)
                && fallback.TryGetValue(key, out var fallbackValue))
                return fallbackValue;

            return key;
        }
    }

    public string Get(string key, params object[] args)
    {
        var template = this[key];
        if (args.Length == 0) return template;
        try { return string.Format(CultureInfo.CurrentCulture, template, args); }
        catch (FormatException) { return template; }
    }
}
