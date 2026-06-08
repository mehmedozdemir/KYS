using MediatR;

namespace Kys.Application.AuditLogs.Queries.GetAuditLogs;

public sealed record GetAuditLogsQuery(
    string? EntityType,
    Guid? EntityId,
    Guid? ChangedBy,
    string? Action,
    DateTime? From,
    DateTime? To,
    int Page = 1,
    int PageSize = 50
) : IRequest<GetAuditLogsResult>;

public sealed record GetAuditLogsResult(IReadOnlyList<AuditLogDto> Items, int TotalCount, int Page, int PageSize);

public sealed record AuditLogDto(
    Guid Id,
    string EntityType,
    Guid EntityId,
    string? EntityName,
    string Action,
    Guid? ChangedBy,
    string? ChangedByName,
    DateTime ChangedAt,
    string? IpAddress
);
