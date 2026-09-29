using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using Kys.Domain.Entities;
using Kys.Domain.Interfaces.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Kys.Infrastructure.Services;

/// <summary>
/// Health URL'lerine GET isteği atar. URL'ler kullanıcı girdisi olduğundan sunucu taraflı istek (SSRF)
/// riskine karşı: yalnızca http/https; bağlanılan IP bağlantı anında kontrol edilir (DNS rebinding'e karşı)
/// ve loopback / link-local (bulut metadata 169.254.169.254 dahil) / multicast / belirsiz adresler engellenir;
/// yönlendirme izlenmez; yanıt gövdesi okunmaz, yalnızca durum kodu ve süre saklanır.
/// Özel ağ aralıkları (10/8, 172.16/12, 192.168/16) müşteri iç ağları için gerektiğinden engellenmez.
/// </summary>
public sealed class EndpointHealthChecker(IHttpClientFactory httpClientFactory) : IEndpointHealthChecker
{
    public const string ClientName = "endpoint-health";
    private static readonly TimeSpan Timeout = TimeSpan.FromSeconds(5);

    public static void Register(IServiceCollection services)
    {
        services.AddHttpClient(ClientName, c =>
            {
                c.Timeout = Timeout;
                c.DefaultRequestHeaders.UserAgent.ParseAdd("KYS-HealthCheck/1.0");
            })
            .ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler
            {
                AllowAutoRedirect = false,
                UseProxy = false,
                UseCookies = false,
                PooledConnectionLifetime = TimeSpan.FromMinutes(2),
                ConnectTimeout = Timeout,
                ConnectCallback = ConnectToAllowedAddressAsync
            });
        services.AddScoped<IEndpointHealthChecker, EndpointHealthChecker>();
    }

    public async Task<EndpointHealthProbe> ProbeAsync(string url, CancellationToken ct = default)
    {
        if (!Uri.TryCreate(url.Trim(), UriKind.Absolute, out var uri) || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            return new EndpointHealthProbe(false, null, null, "invalid-url");

        var client = httpClientFactory.CreateClient(ClientName);
        var sw = Stopwatch.StartNew();
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, uri);
            using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct);
            sw.Stop();
            var code = (int)response.StatusCode;
            // 2xx sağlıklı; 3xx yönlendirme izlenmediği için "erişilebilir" kabul edilir
            var healthy = code is >= 200 and < 400;
            return new EndpointHealthProbe(healthy, code, (int)sw.ElapsedMilliseconds, healthy ? null : $"http-{code}");
        }
        catch (BlockedAddressException)
        {
            return new EndpointHealthProbe(false, null, null, "blocked-address");
        }
        catch (TaskCanceledException) when (!ct.IsCancellationRequested)
        {
            return new EndpointHealthProbe(false, null, null, "timeout");
        }
        catch (HttpRequestException ex)
        {
            // İç hata mesajı ağ ayrıntısı içerebilir; yalnızca kategori saklanır
            var reason = ex.InnerException switch
            {
                BlockedAddressException => "blocked-address",
                SocketException se => "connection-" + se.SocketErrorCode.ToString().ToLowerInvariant(),
                System.Security.Authentication.AuthenticationException => "tls-error",
                _ => ex.HttpRequestError.ToString().ToLowerInvariant()
            };
            return new EndpointHealthProbe(false, null, null, reason);
        }
    }

    private static async ValueTask<Stream> ConnectToAllowedAddressAsync(SocketsHttpConnectionContext context, CancellationToken ct)
    {
        var addresses = await Dns.GetHostAddressesAsync(context.DnsEndPoint.Host, ct);
        var allowed = addresses.Where(IsAllowed).ToArray();
        if (allowed.Length == 0) throw new BlockedAddressException();

        var socket = new Socket(SocketType.Stream, ProtocolType.Tcp) { NoDelay = true };
        try
        {
            await socket.ConnectAsync(allowed, context.DnsEndPoint.Port, ct);
            return new NetworkStream(socket, ownsSocket: true);
        }
        catch
        {
            socket.Dispose();
            throw;
        }
    }

    public static bool IsAllowed(IPAddress address)
    {
        if (address.IsIPv4MappedToIPv6) address = address.MapToIPv4();
        if (IPAddress.IsLoopback(address) || address.Equals(IPAddress.Any) || address.Equals(IPAddress.IPv6Any)
            || address.Equals(IPAddress.Broadcast) || address.Equals(IPAddress.IPv6None))
            return false;

        if (address.AddressFamily == AddressFamily.InterNetwork)
        {
            var b = address.GetAddressBytes();
            if (b[0] == 0) return false;                        // 0.0.0.0/8
            if (b[0] == 169 && b[1] == 254) return false;       // link-local / bulut metadata
            if (b[0] >= 224) return false;                      // multicast + ayrılmış
            if (b[0] == 100 && b[1] == 100 && b[2] == 100 && b[3] == 200) return false; // Alibaba metadata
            return true;
        }

        return !(address.IsIPv6LinkLocal || address.IsIPv6Multicast || address.IsIPv6SiteLocal);
    }

    private sealed class BlockedAddressException() : IOException("blocked-address");
}
