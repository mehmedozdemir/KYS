using MediatR;

namespace Kys.Application.Admin.Queries.GetAuditLogs;

public sealed record GetAuditLogsQuery(
    string? EntityType,
    Guid? EntityId,
    Guid? ChangedBy,
    string? Action,
    DateTime? From,
    DateTime? To,
    int Page = 1,
    int PageSize = 50) : IRequest<AuditLogListDto>;

public sealed record AuditLogListDto(
    IReadOnlyList<AuditLogItemDto> Items,
    int TotalCount,
    int Page,
    int PageSize);

public sealed record AuditLogItemDto(
    Guid Id,
    string EntityType,
    Guid EntityId,
    string? EntityName,
    string Action,
    Guid? ChangedBy,
    DateTime ChangedAt,
    string? IpAddress,
    Guid? CorrelationId);
