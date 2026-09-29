using Kys.Domain.Entities;

namespace Kys.Domain.Interfaces.Services;

/// <summary>Health URL'ine GET atar; yalnızca durum kodu ve süreyi döner (gövde okunmaz).</summary>
public interface IEndpointHealthChecker
{
    Task<EndpointHealthProbe> ProbeAsync(string url, CancellationToken ct = default);
}
