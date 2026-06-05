using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Admin.Queries.GetAuditLogs;

public sealed class GetAuditLogsQueryHandler(IAuditLogQueryRepository repository)
    : IRequestHandler<GetAuditLogsQuery, AuditLogListDto>
{
    public async Task<AuditLogListDto> Handle(GetAuditLogsQuery request, CancellationToken ct)
    {
        var (items, total) = await repository.GetPagedAsync(
            request.EntityType, request.EntityId, request.ChangedBy, request.Action,
            request.From, request.To, request.Page, request.PageSize, ct);

        var dtos = items.Select(l => new AuditLogItemDto(
            l.Id,
            l.EntityType,
            l.EntityId,
            l.EntityName,
            l.Action,
            l.ChangedBy,
            l.ChangedAt,
            l.IpAddress,
            l.CorrelationId)).ToList();

        return new AuditLogListDto(dtos, total, request.Page, request.PageSize);
    }
}
