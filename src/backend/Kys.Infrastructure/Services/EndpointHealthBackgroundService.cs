using Kys.Domain.Entities;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Kys.Infrastructure.Services;

public sealed class HealthMonitoringOptions
{
    public const string Section = "HealthMonitoring";
    public bool Enabled { get; set; } = true;
    public int IntervalMinutes { get; set; } = 5;
    public int MaxConcurrency { get; set; } = 4;
}

/// <summary>
/// İzlenen tüm endpoint'lerin health URL'lerini periyodik olarak kontrol eder ve son sonucu saklar.
/// Her tur için ayrı DI scope açılır; bir endpoint'teki hata diğerlerini etkilemez.
/// </summary>
public sealed class EndpointHealthBackgroundService(
    IServiceScopeFactory scopeFactory,
    IOptions<HealthMonitoringOptions> options,
    ILogger<EndpointHealthBackgroundService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var opt = options.Value;
        if (!opt.Enabled)
        {
            logger.LogInformation("Endpoint sağlık izleme kapalı");
            return;
        }

        // Uygulama açılışında migration'ların bitmesine fırsat ver
        try { await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken); }
        catch (OperationCanceledException) { return; }

        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(Math.Max(1, opt.IntervalMinutes)));
        do
        {
            try
            {
                await RunOnceAsync(Math.Max(1, opt.MaxConcurrency), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Endpoint sağlık kontrol turu başarısız");
            }
        } while (await WaitNextAsync(timer, stoppingToken));
    }

    private static async Task<bool> WaitNextAsync(PeriodicTimer timer, CancellationToken ct)
    {
        try { return await timer.WaitForNextTickAsync(ct); }
        catch (OperationCanceledException) { return false; }
    }

    private async Task RunOnceAsync(int maxConcurrency, CancellationToken ct)
    {
        IReadOnlyList<HealthCheckTarget> targets;
        using (var scope = scopeFactory.CreateScope())
            targets = await scope.ServiceProvider.GetRequiredService<IEndpointHealthRepository>().GetTargetsAsync(ct);
        if (targets.Count == 0) return;

        // Ağ istekleri paralel; sonuçlar tek scope'ta toplu kaydedilir
        var probes = new System.Collections.Concurrent.ConcurrentDictionary<Guid, EndpointHealthProbe>();
        using (var probeScope = scopeFactory.CreateScope())
        {
            var checker = probeScope.ServiceProvider.GetRequiredService<IEndpointHealthChecker>();
            await Parallel.ForEachAsync(targets, new ParallelOptions { MaxDegreeOfParallelism = maxConcurrency, CancellationToken = ct },
                async (t, token) => probes[t.EndpointId] = await checker.ProbeAsync(t.HealthCheckUrl, token));
        }

        using var saveScope = scopeFactory.CreateScope();
        var repo = saveScope.ServiceProvider.GetRequiredService<IEndpointHealthRepository>();
        var clock = saveScope.ServiceProvider.GetRequiredService<IDateTimeProvider>();
        var unitOfWork = saveScope.ServiceProvider.GetRequiredService<IUnitOfWork>();
        var existing = new Dictionary<Guid, EndpointHealth>();
        foreach (var id in probes.Keys)
        {
            var h = await repo.GetAsync(id, ct);
            if (h is null) { h = new EndpointHealth { CustomerEnvironmentEndpointId = id }; repo.Add(h); }
            existing[id] = h;
        }
        var now = clock.UtcNow;
        foreach (var (id, probe) in probes) existing[id].Apply(probe, now);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Endpoint sağlık kontrolü: {Total} endpoint, {Unhealthy} erişilemiyor",
            probes.Count, probes.Values.Count(p => !p.IsHealthy));
    }
}
