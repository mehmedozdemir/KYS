using Asp.Versioning;
using Kys.Application.AuditLogs.Queries.GetAuditLogs;
using Kys.Api.Authorization;
using Kys.Domain.Authorization;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Kys.Api.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/audit-logs")]
[RequirePermission(Capabilities.AdminAudit)]
public sealed class AdminAuditLogController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(GetAuditLogsResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
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
            new GetAuditLogsQuery(entityType, entityId, changedBy, action, from, to, page, pageSize), ct));
}
