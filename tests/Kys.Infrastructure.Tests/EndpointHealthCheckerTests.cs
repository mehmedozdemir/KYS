using System.Net;
using FluentAssertions;
using Kys.Infrastructure.Services;

namespace Kys.Infrastructure.Tests;

public sealed class EndpointHealthCheckerTests
{
    [Theory]
    [InlineData("127.0.0.1")]
    [InlineData("::1")]
    [InlineData("0.0.0.0")]
    [InlineData("169.254.169.254")]   // bulut metadata
    [InlineData("100.100.100.200")]
    [InlineData("224.0.0.1")]
    [InlineData("255.255.255.255")]
    [InlineData("fe80::1")]
    [InlineData("::ffff:127.0.0.1")]  // IPv4-mapped loopback
    public void IsAllowed_BlocksLocalAndMetadataAddresses(string ip)
        => EndpointHealthChecker.IsAllowed(IPAddress.Parse(ip)).Should().BeFalse();

    [Theory]
    [InlineData("10.20.30.40")]       // müşteri iç ağları (VPN) izlenebilmeli
    [InlineData("172.16.5.1")]
    [InlineData("192.168.1.10")]
    [InlineData("8.8.8.8")]
    [InlineData("2001:4860:4860::8888")]
    public void IsAllowed_AllowsPrivateAndPublicAddresses(string ip)
        => EndpointHealthChecker.IsAllowed(IPAddress.Parse(ip)).Should().BeTrue();
}
