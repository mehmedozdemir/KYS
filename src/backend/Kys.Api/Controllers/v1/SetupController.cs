using Asp.Versioning;
using Kys.Application.Setup.Commands.InitializeSystem;
using Kys.Application.Setup.Queries.GetSetupStatus;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Kys.Api.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/setup")]
public sealed class SetupController(IMediator mediator) : ControllerBase
{
    [HttpGet("status")]
    [ProducesResponseType(typeof(SetupStatusResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatus(CancellationToken ct)
        => Ok(await mediator.Send(new GetSetupStatusQuery(), ct));

    [HttpPost("initialize")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Initialize([FromBody] InitializeSystemCommand command, CancellationToken ct)
    {
        await mediator.Send(command, ct);
        return NoContent();
    }
}
