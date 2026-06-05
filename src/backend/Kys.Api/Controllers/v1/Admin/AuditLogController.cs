using Asp.Versioning;
using Kys.Application.Admin.Queries.GetAuditLogs;
using Kys.Api.Authorization;
using Kys.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kys.Api.Controllers.v1.Admin;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/audit-logs")]
[RequirePermission(SystemRole.Codes.PlatformAdmin)]
public sealed class AuditLogController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetLogs(
        [FromQuery] string? entityType,
        [FromQuery] Guid? entityId,
        [FromQuery] Guid? changedBy,
        [FromQuery] string? action,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
        => Ok(await mediator.Send(
            new GetAuditLogsQuery(
                entityType, entityId, changedBy, action, from, to,
                page, Math.Clamp(pageSize, 1, 200)), ct));
}
