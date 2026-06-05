using Kys.Domain.Entities;
using Kys.Domain.Interfaces.Repositories;
using Kys.Infrastructure.Persistence;

namespace Kys.Infrastructure.Persistence.Repositories;

public sealed class AuditLogRepository(AppDbContext db) : IAuditLogRepository
{
    public async Task AddAsync(AuditLog log, CancellationToken ct = default)
        => await db.AuditLogs.AddAsync(log, ct);
}
