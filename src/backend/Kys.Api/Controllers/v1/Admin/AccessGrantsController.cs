using Asp.Versioning;
using Kys.Application.Grants.Commands.CreateGrant;
using Kys.Application.Grants.Commands.RevokeGrant;
using Kys.Application.Grants.Queries.GetGrants;
using Kys.Api.Authorization;
using Kys.Domain.Authorization;
using Kys.Domain.Enumerations;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Kys.Api.Controllers.v1.Admin;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/access-grants")]
[RequirePermission(Capabilities.AdminUsers)]
public sealed class AccessGrantsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? personId, CancellationToken ct)
        => Ok(await mediator.Send(new GetGrantsQuery(personId), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateGrantRequest request, CancellationToken ct)
    {
        var id = await mediator.Send(new CreateGrantCommand(
            request.PersonId, request.Kind, request.ScopeType, request.ScopeId,
            request.Level, request.Capability, request.ExpiresAt), ct);
        return Created(string.Empty, new { id });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Revoke(Guid id, CancellationToken ct)
    {
        await mediator.Send(new RevokeGrantCommand(id), ct);
        return NoContent();
    }
}

public sealed record CreateGrantRequest(
    Guid PersonId,
    GrantKind Kind,
    GrantScopeType? ScopeType,
    Guid? ScopeId,
    GrantLevel? Level,
    string? Capability,
    DateTime? ExpiresAt);
