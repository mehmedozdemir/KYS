namespace Kys.Domain.Interfaces.Services;

/// <summary>
/// Resolves message keys to the current request culture (tr/en).
/// Unknown keys are returned unchanged (literal fallback), so callers may
/// pass either a known key or already-final text safely.
/// </summary>
public interface ILocalizer
{
    /// <summary>Resolves a key for the current UI culture; falls back to the key itself.</summary>
    string this[string key] { get; }

    /// <summary>Resolves a key and formats it with the given arguments (string.Format).</summary>
    string Get(string key, params object[] args);
}
