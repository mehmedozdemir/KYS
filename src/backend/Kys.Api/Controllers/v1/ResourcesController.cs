using Asp.Versioning;
using Kys.Application.Resources.Commands.CreateResourceType;
using Kys.Application.Resources.Commands.CreateSharedResource;
using Kys.Application.Resources.Commands.DeleteResourceType;
using Kys.Application.Resources.Commands.DeleteSharedResource;
using Kys.Application.Resources.Commands.UpdateResourceType;
using Kys.Application.Resources.Commands.UpdateSharedResource;
using Kys.Application.Resources.Queries.GetResourceTypes;
using Kys.Application.Resources.Queries.GetSharedResources;
using Kys.Application.Resources.Queries.GetSharedResourceDetail;
using Kys.Api.Authorization;
using Kys.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kys.Api.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/resources")]
[Authorize]
public sealed class ResourcesController(IMediator mediator) : ControllerBase
{
    [HttpGet("types")]
    public async Task<IActionResult> GetTypes([FromQuery] bool activeOnly = true, CancellationToken ct = default)
        => Ok(await mediator.Send(new GetResourceTypesQuery(activeOnly), ct));

    [HttpPost("types")]
    [RequirePermission(SystemRole.Codes.PlatformAdmin)]
    public async Task<IActionResult> CreateType(CreateResourceTypeRequest request, CancellationToken ct)
    {
        var id = await mediator.Send(new CreateResourceTypeCommand(
            request.Name,
            request.Code,
            request.Category,
            request.Icon,
            request.Description,
            request.FieldSchema), ct);
        return Created($"api/v1/resources/types/{id}", new { id });
    }

    [HttpDelete("types/{id:guid}")]
    [RequirePermission(SystemRole.Codes.PlatformAdmin)]
    public async Task<IActionResult> DeleteType(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteResourceTypeCommand(id), ct);
        return NoContent();
    }

    [HttpPatch("types/{id:guid}")]
    [RequirePermission(SystemRole.Codes.PlatformAdmin)]
    public async Task<IActionResult> UpdateType(Guid id, UpdateResourceTypeRequest request, CancellationToken ct)
    {
        await mediator.Send(new UpdateResourceTypeCommand(
            id,
            request.Name,
            request.Category,
            request.Icon,
            request.Description,
            request.IsActive,
            request.FieldSchema), ct);
        return NoContent();
    }

    [HttpPatch("shared/{id:guid}")]
    [RequirePermission(SystemRole.Codes.PlatformAdmin)]
    public async Task<IActionResult> UpdateSharedResource(Guid id, UpdateSharedResourceRequest request, CancellationToken ct)
    {
        await mediator.Send(new UpdateSharedResourceCommand(id, request.Name, request.Description, request.EnvironmentScope, request.ConnectionFields ?? []), ct);
        return NoContent();
    }

    [HttpDelete("shared/{id:guid}")]
    [RequirePermission(SystemRole.Codes.PlatformAdmin)]
    public async Task<IActionResult> DeleteSharedResource(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteSharedResourceCommand(id), ct);
        return NoContent();
    }

    [HttpGet("shared")]
    public async Task<IActionResult> GetSharedResources([FromQuery] string? scope = null, CancellationToken ct = default)
        => Ok(await mediator.Send(new GetSharedResourcesQuery(scope), ct));

    [HttpGet("shared/{id:guid}")]
    public async Task<IActionResult> GetSharedResourceDetail(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetSharedResourceDetailQuery(id), ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("shared")]
    [RequirePermission(SystemRole.Codes.PlatformAdmin)]
    public async Task<IActionResult> CreateSharedResource(CreateSharedResourceRequest request, CancellationToken ct)
    {
        var id = await mediator.Send(new CreateSharedResourceCommand(
            request.ResourceTypeId,
            request.Name,
            request.Description,
            request.EnvironmentScope,
            request.ConnectionFields), ct);
        return Created($"api/v1/resources/shared/{id}", new { id });
    }
}

public sealed record CreateResourceTypeRequest(
    string Name,
    string Code,
    string? Category,
    string? Icon,
    string? Description,
    Dictionary<string, object?>? FieldSchema);

public sealed record UpdateSharedResourceRequest(
    string Name,
    string? Description,
    string? EnvironmentScope,
    Dictionary<string, object?>? ConnectionFields);

public sealed record UpdateResourceTypeRequest(
    string Name,
    string? Category,
    string? Icon,
    string? Description,
    bool IsActive,
    Dictionary<string, object?>? FieldSchema = null);

public sealed record CreateSharedResourceRequest(
    Guid ResourceTypeId,
    string Name,
    string? Description,
    string? EnvironmentScope,
    Dictionary<string, object?> ConnectionFields);
