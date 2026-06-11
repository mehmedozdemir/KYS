using Asp.Versioning;
using Kys.Api.Authorization;
using Kys.Domain.Authorization;
using Kys.Application.Admin.Commands.AssignSystemRole;
using Kys.Application.Admin.Commands.RemoveSystemRole;
using Kys.Application.Admin.Commands.ResetPassword;
using Kys.Application.Admin.Commands.UnlockAccount;
using Kys.Application.People.Commands.MakePlatformUser;
using Kys.Application.People.Commands.MakePlatformUsers;
using Kys.Application.People.Queries.GetProvisionablePeople;
using Kys.Application.Admin.Queries.GetPersonSystemRoles;
using Kys.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Kys.Api.Controllers.v1.Admin;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/users/{personId:guid}/system-roles")]
[RequirePermission(Capabilities.AdminUsers)]
public sealed class UserRolesController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<SystemRoleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRoles(Guid personId, CancellationToken ct)
        => Ok(await mediator.Send(new GetPersonSystemRolesQuery(personId), ct));

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> AssignRole(
        Guid personId,
        [FromBody] AssignRoleRequest request,
        CancellationToken ct)
    {
        await mediator.Send(new AssignSystemRoleCommand(personId, request.SystemRoleId), ct);
        return NoContent();
    }

    [HttpDelete("{systemRoleId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveRole(Guid personId, Guid systemRoleId, CancellationToken ct)
    {
        await mediator.Send(new RemoveSystemRoleCommand(personId, systemRoleId), ct);
        return NoContent();
    }

    [HttpGet("/api/v{version:apiVersion}/admin/users/provisionable")]
    [ProducesResponseType(typeof(IReadOnlyList<ProvisionableGroupDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProvisionable(CancellationToken ct)
        => Ok(await mediator.Send(new GetProvisionablePeopleQuery(), ct));

    [HttpPost("/api/v{version:apiVersion}/admin/users/make-platform-users")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> MakePlatformUsers([FromBody] MakePlatformUsersRequest request, CancellationToken ct)
    {
        var count = await mediator.Send(new MakePlatformUsersCommand(request.PersonIds), ct);
        return Ok(new { provisioned = count });
    }

    [HttpPost("/api/v{version:apiVersion}/admin/users/{personId:guid}/make-platform-user")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> MakePlatformUser(Guid personId, [FromBody] MakePlatformUserRequest request, CancellationToken ct)
    {
        await mediator.Send(new MakePlatformUserCommand(personId, request.Password), ct);
        return NoContent();
    }

    [HttpPost("/api/v{version:apiVersion}/admin/users/{personId:guid}/reset-password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResetPassword(Guid personId, [FromBody] ResetPasswordRequest request, CancellationToken ct)
    {
        await mediator.Send(new ResetPasswordCommand(personId, request.NewPassword), ct);
        return NoContent();
    }

    [HttpPost("/api/v{version:apiVersion}/admin/users/{personId:guid}/unlock")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Unlock(Guid personId, CancellationToken ct)
    {
        await mediator.Send(new UnlockAccountCommand(personId), ct);
        return NoContent();
    }
}

public sealed record AssignRoleRequest(Guid SystemRoleId);
public sealed record ResetPasswordRequest(string NewPassword);
public sealed record MakePlatformUserRequest(string Password);
public sealed record MakePlatformUsersRequest(IReadOnlyList<Guid> PersonIds);
