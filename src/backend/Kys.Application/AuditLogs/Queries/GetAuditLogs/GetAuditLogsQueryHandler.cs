using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.AuditLogs.Queries.GetAuditLogs;

public sealed class GetAuditLogsQueryHandler(
    IAuditLogQueryRepository auditLogRepo,
    IPersonRepository personRepo)
    : IRequestHandler<GetAuditLogsQuery, GetAuditLogsResult>
{
    public async Task<GetAuditLogsResult> Handle(GetAuditLogsQuery request, CancellationToken ct)
    {
        var (items, total) = await auditLogRepo.GetPagedAsync(
            request.EntityType,
            request.EntityId,
            request.ChangedBy,
            request.Action,
            request.From,
            request.To,
            request.Page,
            request.PageSize,
            ct);

        // Bulk-load person names for all unique ChangedBy values
        var personIds = items.Where(l => l.ChangedBy.HasValue)
            .Select(l => l.ChangedBy!.Value).Distinct().ToList();

        var nameMap = new Dictionary<Guid, string>();
        foreach (var pid in personIds)
        {
            var p = await personRepo.GetByIdAsync(pid, ct);
            if (p is not null) nameMap[pid] = p.FullName;
        }

        var dtos = items.Select(l => new AuditLogDto(
            l.Id,
            l.EntityType,
            l.EntityId,
            l.EntityName,
            l.Action,
            l.ChangedBy,
            l.ChangedBy.HasValue && nameMap.TryGetValue(l.ChangedBy.Value, out var name) ? name : null,
            l.ChangedAt,
            l.IpAddress
        )).ToList();

        return new GetAuditLogsResult(dtos, total, request.Page, request.PageSize);
    }
}
