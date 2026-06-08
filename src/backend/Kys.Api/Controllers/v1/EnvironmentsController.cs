using Asp.Versioning;
using Kys.Application.Environments.Commands.AddResourceToEnvironment;
using Kys.Application.Environments.Commands.CreateCustomerEnvironment;
using Kys.Application.Environments.Commands.RemoveEnvironmentResource;
using Kys.Application.Environments.Commands.SetEnvironmentEndpointUrl;
using Kys.Application.Environments.Queries.GetCustomerEnvironments;
using Kys.Application.Environments.Queries.GetEnvironmentDetail;
using Kys.Application.Environments.Queries.GetEnvironmentTypes;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kys.Api.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/environments")]
[Authorize]
public sealed class EnvironmentsController(IMediator mediator) : ControllerBase
{
    [HttpGet("types")]
    public async Task<IActionResult> GetTypes(CancellationToken ct)
        => Ok(await mediator.Send(new GetEnvironmentTypesQuery(), ct));

    [HttpGet("customer-products/{customerProductId:guid}")]
    public async Task<IActionResult> GetByCustomerProduct(Guid customerProductId, CancellationToken ct)
        => Ok(await mediator.Send(new GetCustomerEnvironmentsQuery(customerProductId), ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetDetail(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetEnvironmentDetailQuery(id), ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateCustomerEnvironmentRequest request, CancellationToken ct)
    {
        var id = await mediator.Send(new CreateCustomerEnvironmentCommand(
            request.CustomerProductId,
            request.EnvironmentTypeId,
            request.Name,
            request.Notes), ct);
        return CreatedAtAction(nameof(GetDetail), new { id }, new { id });
    }

    [HttpPost("{environmentId:guid}/resources")]
    public async Task<IActionResult> AddResource(
        Guid environmentId,
        AddResourceToEnvironmentRequest request,
        CancellationToken ct)
    {
        var id = await mediator.Send(new AddResourceToEnvironmentCommand(
            environmentId,
            request.ProductResourceTemplateId,
            request.IsShared,
            request.SharedResourceId,
            request.ConnectionFields,
            request.Notes), ct);
        return Created($"api/v1/environments/{environmentId}/resources/{id}", new { id });
    }

    [HttpDelete("{environmentId:guid}/resources/{resourceId:guid}")]
    public async Task<IActionResult> RemoveResource(Guid environmentId, Guid resourceId, CancellationToken ct)
    {
        await mediator.Send(new RemoveEnvironmentResourceCommand(resourceId), ct);
        return NoContent();
    }

    [HttpPut("{environmentId:guid}/endpoints/{productEndpointId:guid}")]
    public async Task<IActionResult> SetEndpointUrl(
        Guid environmentId,
        Guid productEndpointId,
        SetEnvironmentEndpointUrlRequest request,
        CancellationToken ct)
    {
        var id = await mediator.Send(new SetEnvironmentEndpointUrlCommand(
            environmentId,
            productEndpointId,
            request.BaseUrl,
            request.SwaggerUrl,
            request.HealthCheckUrl,
            request.AuthType,
            request.AuthConfig,
            request.Notes), ct);
        return Ok(new { id });
    }
}

public sealed record CreateCustomerEnvironmentRequest(
    Guid CustomerProductId,
    Guid EnvironmentTypeId,
    string Name,
    string? Notes);

public sealed record AddResourceToEnvironmentRequest(
    Guid ProductResourceTemplateId,
    bool IsShared,
    Guid? SharedResourceId,
    Dictionary<string, object?> ConnectionFields,
    string? Notes);

public sealed record SetEnvironmentEndpointUrlRequest(
    string BaseUrl,
    string? SwaggerUrl,
    string? HealthCheckUrl,
    Kys.Domain.Enumerations.AuthType? AuthType,
    Dictionary<string, object?> AuthConfig,
    string? Notes);
