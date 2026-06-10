using Asp.Versioning;
using Kys.Domain.Authorization;
using Kys.Application.Environments.Commands.CreateHostingPlatform;
using Kys.Application.Environments.Commands.UpdateHostingPlatform;
using Kys.Application.Environments.Commands.DeleteHostingPlatform;
using Kys.Api.Authorization;
using Kys.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Kys.Api.Controllers.v1.Admin;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/hosting-platforms")]
[RequirePermission(Capabilities.AdminConfig)]
public sealed class HostingPlatformsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(CreateHostingPlatformRequest request, CancellationToken ct)
    {
        var id = await mediator.Send(new CreateHostingPlatformCommand(
            request.Name, request.Code, request.Description,
            request.Category, request.Icon, request.Color, request.SortOrder), ct);
        return Created($"api/v1/environments/hosting-platforms/{id}", new { id });
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, UpdateHostingPlatformRequest request, CancellationToken ct)
    {
        await mediator.Send(new UpdateHostingPlatformCommand(
            id, request.Name, request.Code, request.Description,
            request.Category, request.Icon, request.Color, request.SortOrder, request.IsActive), ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteHostingPlatformCommand(id), ct);
        return NoContent();
    }
}

public sealed record CreateHostingPlatformRequest(
    string Name, string Code, string? Description,
    string? Category, string? Icon, string? Color, int SortOrder);

public sealed record UpdateHostingPlatformRequest(
    string Name, string Code, string? Description,
    string? Category, string? Icon, string? Color, int SortOrder, bool IsActive);
