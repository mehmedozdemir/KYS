using Asp.Versioning;
using Kys.Api.Authorization;
using Kys.Application.Dashboard.Queries.GetDashboardStats;
using Kys.Application.Dashboard.Queries.GetExecutiveSummary;
using Kys.Domain.Authorization;
using Kys.Application.Dashboard.Queries.GetMyWorkspace;
using Kys.Application.Dashboard.Queries.GetRecentActivities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kys.Api.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/dashboard")]
[Authorize]
public sealed class DashboardController(IMediator mediator) : ControllerBase
{
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(CancellationToken ct)
        => Ok(await mediator.Send(new GetDashboardStatsQuery(), ct));

    // Audit log içeriği (tüm müşteriler): yalnızca denetim yetkisiyle.
    [HttpGet("recent-activities")]
    [RequirePermission(Capabilities.AdminAudit)]
    public async Task<IActionResult> GetRecentActivities([FromQuery] int count = 20, CancellationToken ct = default)
        => Ok(await mediator.Send(new GetRecentActivitiesQuery(Math.Clamp(count, 5, 50)), ct));

    [HttpGet("my-workspace")]
    public async Task<IActionResult> GetMyWorkspace([FromQuery] bool allCustomers = false, CancellationToken ct = default)
        => Ok(await mediator.Send(new GetMyWorkspaceQuery(allCustomers), ct));

    // Şirket geneli yönetici özeti; sözleşme bedelleri gibi hassas toplamlar içerir.
    [HttpGet("executive")]
    [RequirePermission(Capabilities.ScopeGlobal)]
    public async Task<IActionResult> GetExecutiveSummary(CancellationToken ct)
        => Ok(await mediator.Send(new GetExecutiveSummaryQuery(), ct));
}
