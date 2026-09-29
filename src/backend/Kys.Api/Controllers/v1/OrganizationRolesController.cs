using Asp.Versioning;
using Kys.Api.Authorization;
using Kys.Application.Teams.Commands.OrganizationRoles;
using Kys.Application.Teams.Queries.GetOrganizationRoles;
using Kys.Domain.Authorization;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kys.Api.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/organization-roles")]
[Authorize]
public sealed class OrganizationRolesController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<OrganizationRoleDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
        => Ok(await mediator.Send(new GetOrganizationRolesQuery(), ct));

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    [RequirePermission(Capabilities.AdminConfig)]
    public async Task<IActionResult> Create([FromBody] OrganizationRoleRequest request, CancellationToken ct)
    {
        var id = await mediator.Send(new CreateOrganizationRoleCommand(request.Name, request.Description), ct);
        return Created($"api/v1/organization-roles/{id}", new { id });
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [RequirePermission(Capabilities.AdminConfig)]
    public async Task<IActionResult> Update(Guid id, [FromBody] OrganizationRoleRequest request, CancellationToken ct)
    {
        await mediator.Send(new UpdateOrganizationRoleCommand(id, request.Name, request.Description), ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [RequirePermission(Capabilities.AdminConfig)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteOrganizationRoleCommand(id), ct);
        return NoContent();
    }
}

public sealed record OrganizationRoleRequest(string Name, string? Description);
