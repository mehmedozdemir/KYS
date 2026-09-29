using FluentAssertions;
using Kys.Domain.Entities;
using Kys.Domain.Enumerations;

namespace Kys.Domain.Tests;

public sealed class EndpointHealthTests
{
    private static readonly DateTime T0 = new(2026, 9, 29, 10, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Apply_SameStatus_KeepsStatusSince()
    {
        var h = new EndpointHealth();
        h.Apply(new EndpointHealthProbe(true, 200, 40, null), T0);
        h.Apply(new EndpointHealthProbe(true, 200, 55, null), T0.AddMinutes(5));

        h.Status.Should().Be(EndpointHealthStatus.Healthy);
        h.StatusSince.Should().Be(T0);
        h.CheckedAt.Should().Be(T0.AddMinutes(5));
        h.LatencyMs.Should().Be(55);
    }

    [Fact]
    public void Apply_StatusChange_ResetsStatusSince()
    {
        var h = new EndpointHealth();
        h.Apply(new EndpointHealthProbe(true, 200, 40, null), T0);
        h.Apply(new EndpointHealthProbe(false, null, null, "timeout"), T0.AddMinutes(5));

        h.Status.Should().Be(EndpointHealthStatus.Unhealthy);
        h.StatusSince.Should().Be(T0.AddMinutes(5));
        h.Error.Should().Be("timeout");
        h.StatusCode.Should().BeNull();
    }
}
