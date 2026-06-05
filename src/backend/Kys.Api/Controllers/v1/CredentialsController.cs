using Asp.Versioning;
using Kys.Application.Credentials.Commands.RevealCredential;
using Kys.Application.Credentials.Commands.SetCredential;
using Kys.Api.Authorization;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kys.Api.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/credentials")]
[Authorize]
public sealed class CredentialsController(IMediator mediator) : ControllerBase
{
    [HttpPut]
    [RequirePermission("Credentials.Write")]
    public async Task<IActionResult> Set(SetCredentialRequest request, CancellationToken ct)
    {
        var id = await mediator.Send(new SetCredentialCommand(
            request.EnvironmentResourceId,
            request.SharedResourceId,
            request.FieldKey,
            request.PlainValue), ct);
        return Ok(new { id });
    }

    [HttpGet("{id:guid}/reveal")]
    [RequirePermission("Credentials.View")]
    public async Task<IActionResult> Reveal(Guid id, CancellationToken ct)
    {
        var value = await mediator.Send(new RevealCredentialCommand(id), ct);
        return Ok(new { value });
    }
}

public sealed record SetCredentialRequest(
    Guid? EnvironmentResourceId,
    Guid? SharedResourceId,
    string FieldKey,
    string PlainValue);
