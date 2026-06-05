using System.Text.Json;
using Kys.Domain.Entities.Base;
using Kys.Domain.Interfaces.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;

namespace Kys.Infrastructure.Persistence.Interceptors;

public sealed class AuditLogInterceptor(
    ICurrentUserService currentUserService,
    ILogger<AuditLogInterceptor> logger) : SaveChangesInterceptor
{
    public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context is null)
            return await base.SavingChangesAsync(eventData, result, cancellationToken);

        var auditEntries = eventData.Context.ChangeTracker
            .Entries<AuditableEntity>()
            .Where(e => e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
            .Select(e => new
            {
                EntityType = e.Entity.GetType().Name,
                EntityId = e.Entity.Id,
                Action = e.State.ToString(),
                OldValues = e.State == EntityState.Added
                    ? null
                    : JsonSerializer.Serialize(e.OriginalValues.ToObject()),
                NewValues = e.State == EntityState.Deleted
                    ? null
                    : JsonSerializer.Serialize(e.CurrentValues.ToObject()),
                ChangedBy = currentUserService.UserId,
                ChangedAt = DateTime.UtcNow
            })
            .ToList();

        foreach (var entry in auditEntries)
        {
            logger.LogInformation(
                "Audit: {Action} on {EntityType} [{EntityId}] by {ChangedBy}",
                entry.Action, entry.EntityType, entry.EntityId, entry.ChangedBy);
        }

        return await base.SavingChangesAsync(eventData, result, cancellationToken);
    }
}
