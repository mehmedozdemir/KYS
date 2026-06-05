using Asp.Versioning;
using Kys.Application.Admin.Queries.GetPlatformStats;
using Kys.Api.Authorization;
using Kys.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kys.Api.Controllers.v1.Admin;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/stats")]
[RequirePermission(SystemRole.Codes.PlatformAdmin)]
public sealed class PlatformStatsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetStats(CancellationToken ct)
        => Ok(await mediator.Send(new GetPlatformStatsQuery(), ct));
}
