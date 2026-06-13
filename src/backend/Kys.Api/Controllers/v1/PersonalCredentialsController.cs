using Asp.Versioning;
using Kys.Application.Credentials.Commands.DeletePersonalCredential;
using Kys.Application.Credentials.Commands.RevealPersonalCredential;
using Kys.Application.Credentials.Commands.SetPersonalCredential;
using Kys.Application.Credentials.Queries.GetMyPersonalCredentials;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kys.Api.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/personal-credentials")]
[Authorize]
public sealed class PersonalCredentialsController(IMediator mediator) : ControllerBase
{
    /// <summary>
    /// Returns the current user's personal credential stubs for a resource (no decryption).
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetMine(
        [FromQuery] Guid? environmentResourceId,
        [FromQuery] Guid? sharedResourceId,
        CancellationToken ct)
    {
        var result = await mediator.Send(
            new GetMyPersonalCredentialsQuery(environmentResourceId, sharedResourceId), ct);
        return Ok(result);
    }

    /// <summary>
    /// Creates or updates the current user's personal credential for a resource field.
    /// </summary>
    [HttpPut]
    public async Task<IActionResult> Set(SetPersonalCredentialRequest request, CancellationToken ct)
    {
        var id = await mediator.Send(new SetPersonalCredentialCommand(
            request.EnvironmentResourceId,
            request.SharedResourceId,
            request.FieldKey,
            request.PlainValue), ct);
        return Ok(new { id });
    }

    /// <summary>
    /// Reveals the plaintext value of a personal credential. Only the owner can call this.
    /// </summary>
    [HttpGet("{id:guid}/reveal")]
    public async Task<IActionResult> Reveal(Guid id, CancellationToken ct)
    {
        var value = await mediator.Send(new RevealPersonalCredentialCommand(id), ct);
        return Ok(new { value });
    }

    /// <summary>
    /// Soft-deletes a personal credential. The owner or a user with personal-credential:manage may call this.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeletePersonalCredentialCommand(id), ct);
        return NoContent();
    }
}

public sealed record SetPersonalCredentialRequest(
    Guid? EnvironmentResourceId,
    Guid? SharedResourceId,
    string FieldKey,
    string PlainValue);
