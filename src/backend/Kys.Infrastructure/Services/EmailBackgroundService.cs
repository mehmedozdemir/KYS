using Kys.Domain.Interfaces.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Kys.Infrastructure.Services;

/// <summary>
/// Kuyruğa atılan e-postaları arka planda gönderir. Her mesaj için ayrı DI scope açar
/// (IEmailSender scoped; DbContext gerektirir). Gönderim hatası loglanır, kuyruk devam eder.
/// </summary>
public sealed class EmailBackgroundService(
    EmailQueue queue,
    IServiceScopeFactory scopeFactory,
    ILogger<EmailBackgroundService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var message in queue.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var sender = scope.ServiceProvider.GetRequiredService<IEmailSender>();
                await sender.SendAsync(message.ToEmail, message.ToName, message.Subject, message.HtmlBody, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Arka plan e-posta gönderimi başarısız: {Email}", message.ToEmail);
            }
        }
    }
}
