using Asp.Versioning;
using Kys.Application.Resources.Commands.CreateResourceType;
using Kys.Application.Resources.Commands.CreateSharedResource;
using Kys.Application.Resources.Queries.GetResourceTypes;
using Kys.Application.Resources.Queries.GetSharedResources;
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

    [HttpGet("shared")]
    public async Task<IActionResult> GetSharedResources([FromQuery] string? scope = null, CancellationToken ct = default)
        => Ok(await mediator.Send(new GetSharedResourcesQuery(scope), ct));

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
    Dictionary<string, object?> FieldSchema);

public sealed record CreateSharedResourceRequest(
    Guid ResourceTypeId,
    string Name,
    string? Description,
    string? EnvironmentScope,
    Dictionary<string, object?> ConnectionFields);
