using Asp.Versioning;
using Kys.Application.Products.Commands.AssignPersonToProduct;
using Kys.Application.Products.Commands.AssignTeamToProduct;
using Kys.Application.Products.Commands.RemoveTeamFromProduct;
using Kys.Application.Products.Commands.RemovePersonFromProduct;
using Kys.Application.Products.Commands.CreateProduct;
using Kys.Application.Products.Commands.CreateProductEndpoint;
using Kys.Application.Products.Commands.CreateProductResourceTemplate;
using Kys.Application.Products.Commands.DeleteProduct;
using Kys.Application.Products.Commands.DeleteProductEndpoint;
using Kys.Application.Products.Commands.DeleteProductResourceTemplate;
using Kys.Application.Products.Commands.UpdateProduct;
using Kys.Application.Products.Commands.UpdateProductResourceTemplate;
using Kys.Application.Products.Commands.UpdateProductEndpoint;
using Kys.Application.Products.Queries.GetProductDetail;
using Kys.Application.Products.Queries.GetProducts;
using Kys.Api.Authorization;
using Kys.Domain.Authorization;
using Kys.Domain.Enumerations;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kys.Api.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/products")]
[Authorize]
public sealed class ProductsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(GetProductsResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] ProductType? type,
        [FromQuery] ProductStatus? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
        => Ok(await mediator.Send(new GetProductsQuery(search, type, status, page, pageSize), ct));

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ProductDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        => Ok(await mediator.Send(new GetProductDetailQuery(id), ct));

    [HttpPost]
    [RequirePermission(Capabilities.ProductCreate)]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Create([FromBody] CreateProductCommand command, CancellationToken ct)
    {
        var id = await mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id, version = "1" }, new { id });
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [RequirePermission(Capabilities.ProductWrite)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteProductCommand(id), ct);
        return NoContent();
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [RequirePermission(Capabilities.ProductWrite)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProductRequest request, CancellationToken ct)
    {
        await mediator.Send(new UpdateProductCommand(
            id, request.Name, request.Description, request.Version,
            request.Status, request.PoPersonId, request.TechStack,
            request.RepositoryUrl, request.DocumentationUrl, request.CustomFields), ct);
        return NoContent();
    }

    // --- Teams ---

    [HttpPost("{productId:guid}/teams")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [RequirePermission(Capabilities.ProductAssign)]
    public async Task<IActionResult> AssignTeam(Guid productId, [FromBody] AssignTeamRequest request, CancellationToken ct)
    {
        await mediator.Send(new AssignTeamToProductCommand(productId, request.TeamId, request.Role, request.Since), ct);
        return NoContent();
    }

    [HttpDelete("{productId:guid}/teams/{teamId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [RequirePermission(Capabilities.ProductAssign)]
    public async Task<IActionResult> RemoveTeam(Guid productId, Guid teamId, CancellationToken ct)
    {
        await mediator.Send(new RemoveTeamFromProductCommand(productId, teamId), ct);
        return NoContent();
    }

    // --- Assignments ---

    [HttpPost("{productId:guid}/assignments")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [RequirePermission(Capabilities.ProductAssign)]
    public async Task<IActionResult> AssignPerson(Guid productId, [FromBody] AssignPersonRequest request, CancellationToken ct)
    {
        var id = await mediator.Send(new AssignPersonToProductCommand(productId, request.PersonId, request.Responsibility, request.StartedAt), ct);
        return Created(string.Empty, new { id });
    }

    [HttpDelete("{productId:guid}/assignments/{personId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [RequirePermission(Capabilities.ProductAssign)]
    public async Task<IActionResult> RemovePerson(Guid productId, Guid personId, CancellationToken ct)
    {
        await mediator.Send(new RemovePersonFromProductCommand(productId, personId), ct);
        return NoContent();
    }

    // --- Endpoints ---

    [HttpPost("{productId:guid}/endpoints")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [RequirePermission(Capabilities.ProductWrite)]
    public async Task<IActionResult> CreateEndpoint(Guid productId, [FromBody] CreateEndpointRequest request, CancellationToken ct)
    {
        var id = await mediator.Send(new CreateProductEndpointCommand(
            productId, request.Name, request.EndpointType, request.Description,
            request.SortOrder, request.DefaultBaseUrl, request.SwaggerUrl,
            request.HealthCheckUrl, request.DefaultAuthType), ct);
        return Created(string.Empty, new { id });
    }

    [HttpPut("{productId:guid}/endpoints/{endpointId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [RequirePermission(Capabilities.ProductWrite)]
    public async Task<IActionResult> UpdateEndpoint(Guid productId, Guid endpointId, [FromBody] UpdateEndpointRequest request, CancellationToken ct)
    {
        await mediator.Send(new UpdateProductEndpointCommand(
            productId, endpointId, request.Name, request.Description, request.SortOrder,
            request.DefaultBaseUrl, request.SwaggerUrl, request.HealthCheckUrl, request.DefaultAuthType), ct);
        return NoContent();
    }

    [HttpDelete("{productId:guid}/endpoints/{endpointId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [RequirePermission(Capabilities.ProductWrite)]
    public async Task<IActionResult> DeleteEndpoint(Guid productId, Guid endpointId, CancellationToken ct)
    {
        await mediator.Send(new DeleteProductEndpointCommand(productId, endpointId), ct);
        return NoContent();
    }

    // --- Resource Templates ---

    [HttpPost("{productId:guid}/resource-templates")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [RequirePermission(Capabilities.ProductWrite)]
    public async Task<IActionResult> CreateResourceTemplate(Guid productId, [FromBody] CreateResourceTemplateRequest request, CancellationToken ct)
    {
        var id = await mediator.Send(new CreateProductResourceTemplateCommand(
            productId, request.ResourceTypeId, request.Name, request.Description,
            request.IsRequired, request.CanBeShared, request.SortOrder, request.SharedResourceId), ct);
        return Created(string.Empty, new { id });
    }

    [HttpPut("{productId:guid}/resource-templates/{templateId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [RequirePermission(Capabilities.ProductWrite)]
    public async Task<IActionResult> UpdateResourceTemplate(Guid productId, Guid templateId, [FromBody] UpdateResourceTemplateRequest request, CancellationToken ct)
    {
        await mediator.Send(new UpdateProductResourceTemplateCommand(
            productId, templateId, request.Name, request.Description,
            request.IsRequired, request.CanBeShared, request.SortOrder), ct);
        return NoContent();
    }

    [HttpDelete("{productId:guid}/resource-templates/{templateId:guid}")]
    [RequirePermission(Capabilities.ProductWrite)]
    public async Task<IActionResult> DeleteResourceTemplate(Guid productId, Guid templateId, CancellationToken ct)
    {
        await mediator.Send(new DeleteProductResourceTemplateCommand(productId, templateId), ct);
        return NoContent();
    }
}

public sealed record UpdateProductRequest(
    string Name, string? Description, string? Version, ProductStatus Status,
    Guid? PoPersonId, List<string>? TechStack, string? RepositoryUrl, string? DocumentationUrl,
    Dictionary<string, object?>? CustomFields);

public sealed record AssignTeamRequest(Guid TeamId, string? Role, DateOnly? Since);
public sealed record AssignPersonRequest(Guid PersonId, string? Responsibility, DateOnly? StartedAt);

public sealed record CreateEndpointRequest(
    string Name, EndpointType EndpointType, string? Description, int SortOrder,
    string? DefaultBaseUrl, string? SwaggerUrl, string? HealthCheckUrl, AuthType DefaultAuthType);

public sealed record UpdateEndpointRequest(
    string Name, string? Description, int SortOrder,
    string? DefaultBaseUrl, string? SwaggerUrl, string? HealthCheckUrl, AuthType DefaultAuthType);

public sealed record CreateResourceTemplateRequest(
    Guid ResourceTypeId, string Name, string? Description,
    bool IsRequired, bool CanBeShared, int SortOrder, Guid? SharedResourceId = null);

public sealed record UpdateResourceTemplateRequest(
    string Name, string? Description,
    bool IsRequired, bool CanBeShared, int SortOrder);

// NOTE: endpoint lives under resource-templates, not products, for simplicity
