using Kys.Domain.Entities;

namespace Kys.Domain.Interfaces.Repositories;

public interface IAuditLogQueryRepository
{
    Task<(IReadOnlyList<AuditLog> Items, int TotalCount)> GetPagedAsync(
        string? entityType,
        Guid? entityId,
        Guid? changedBy,
        string? action,
        DateTime? from,
        DateTime? to,
        int page,
        int pageSize,
        CancellationToken ct = default);
}
