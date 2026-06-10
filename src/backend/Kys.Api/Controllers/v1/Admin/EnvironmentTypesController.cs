using Asp.Versioning;
using Kys.Application.Environments.Commands.CreateEnvironmentType;
using Kys.Application.Environments.Commands.UpdateEnvironmentType;
using Kys.Application.Environments.Commands.DeleteEnvironmentType;
using Kys.Api.Authorization;
using Kys.Domain.Authorization;
using Kys.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kys.Api.Controllers.v1.Admin;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/environment-types")]
[RequirePermission(Capabilities.AdminConfig)]
public sealed class EnvironmentTypesController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(CreateEnvironmentTypeRequest request, CancellationToken ct)
    {
        var id = await mediator.Send(new CreateEnvironmentTypeCommand(
            request.Name,
            request.Code,
            request.Description,
            request.SortOrder,
            request.Color), ct);
        return Created($"api/v1/environments/types/{id}", new { id });
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, UpdateEnvironmentTypeRequest request, CancellationToken ct)
    {
        await mediator.Send(new UpdateEnvironmentTypeCommand(
            id,
            request.Name,
            request.Code,
            request.Description,
            request.SortOrder,
            request.Color), ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteEnvironmentTypeCommand(id), ct);
        return NoContent();
    }
}

public sealed record CreateEnvironmentTypeRequest(
    string Name,
    string Code,
    string? Description,
    int SortOrder,
    string? Color);

public sealed record UpdateEnvironmentTypeRequest(
    string Name,
    string Code,
    string? Description,
    int SortOrder,
    string? Color);
