using Asp.Versioning;
using Kys.Application.Search.Queries.GlobalSearch;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kys.Api.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/search")]
[Authorize]
public sealed class SearchController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Search(
        [FromQuery] string q,
        [FromQuery] int limit = 5,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
            return Ok(new { customers = Array.Empty<object>(), products = Array.Empty<object>(), people = Array.Empty<object>(), teams = Array.Empty<object>() });

        var result = await mediator.Send(new GlobalSearchQuery(q, Math.Clamp(limit, 1, 10)), ct);
        return Ok(result);
    }
}
