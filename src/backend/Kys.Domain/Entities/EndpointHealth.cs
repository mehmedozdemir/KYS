using Kys.Domain.Entities.Base;
using Kys.Domain.Enumerations;

namespace Kys.Domain.Entities;

/// <summary>
/// Bir ortam endpoint'inin son sağlık kontrolü sonucu (endpoint başına tek satır, üzerine yazılır).
/// Periyodik izleme verisidir; kullanıcı işlemi olmadığı için audit log'a yazılmaz.
/// </summary>
public sealed class EndpointHealth : INotAudited
{
    public Guid CustomerEnvironmentEndpointId { get; set; }
    public EndpointHealthStatus Status { get; set; }
    public int? StatusCode { get; set; }
    public int? LatencyMs { get; set; }
    public string? Error { get; set; }
    public DateTime CheckedAt { get; set; }

    // Mevcut durumun başladığı an (ör. "2 saattir erişilemiyor")
    public DateTime StatusSince { get; set; }

    public CustomerEnvironmentEndpoint Endpoint { get; set; } = null!;

    public void Apply(EndpointHealthProbe probe, DateTime now)
    {
        var status = probe.IsHealthy ? EndpointHealthStatus.Healthy : EndpointHealthStatus.Unhealthy;
        if (status != Status || StatusSince == default) StatusSince = now;
        Status = status;
        StatusCode = probe.StatusCode;
        LatencyMs = probe.LatencyMs;
        Error = probe.Error;
        CheckedAt = now;
    }
}

/// <summary>Tek bir sağlık isteğinin sonucu.</summary>
public sealed record EndpointHealthProbe(bool IsHealthy, int? StatusCode, int? LatencyMs, string? Error);
