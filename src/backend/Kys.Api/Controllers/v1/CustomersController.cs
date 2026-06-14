using Asp.Versioning;
using Kys.Application.Customers.Commands.AddProductToCustomer;
using Kys.Application.Customers.Commands.RemoveCustomerProduct;
using Kys.Application.Customers.Commands.ArchiveCustomer;
using Kys.Application.Customers.Commands.CreateCustomer;
using Kys.Application.Customers.Commands.CreateCustomerVpnConfig;
using Kys.Application.Customers.Commands.DeleteCustomer;
using Kys.Application.Customers.Commands.DeleteCustomerVpnConfig;
using Kys.Application.Customers.Commands.RestoreCustomer;
using Kys.Application.Customers.Commands.RevealVpnPassword;
using Kys.Application.Customers.Commands.UpdateCustomer;
using Kys.Application.Customers.Commands.UpdateCustomerProductStatus;
using Kys.Application.Customers.Commands.UpdateCustomerStatus;
using Kys.Application.Customers.Commands.UpdateCustomerVpnConfig;
using Kys.Application.Customers.Queries.GetCustomerDetail;
using Kys.Application.Customers.Queries.GetCustomers;
using Kys.Application.Customers.Queries.GetCustomerVpnConfigs;
using Kys.Api.Authorization;
using Kys.Domain.Authorization;
using Kys.Domain.Enumerations;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kys.Api.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/customers")]
[Authorize]
public sealed class CustomersController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(GetCustomersResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] CustomerStatus? status,
        [FromQuery] bool includeArchived = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
        => Ok(await mediator.Send(new GetCustomersQuery(search, status, includeArchived, page, pageSize), ct));

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(CustomerDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        => Ok(await mediator.Send(new GetCustomerDetailQuery(id), ct));

    [HttpPost]
    [RequirePermission(Capabilities.CustomerCreate)]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Create([FromBody] CreateCustomerCommand command, CancellationToken ct)
    {
        var id = await mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id, version = "1" }, new { id });
    }

    [HttpDelete("{id:guid}")]
    [RequirePermission(Capabilities.CustomerArchive)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteCustomerCommand(id), ct);
        return NoContent();
    }

    [HttpPut("{id:guid}")]
    [RequirePermission(Capabilities.CustomerWrite)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCustomerRequest request, CancellationToken ct)
    {
        await mediator.Send(new UpdateCustomerCommand(
            id, request.Name, request.ShortName, request.Description,
            request.Sector, request.Country, request.City,
            request.PrimaryContactName, request.PrimaryContactEmail,
            request.PrimaryContactPhone, request.CustomFields), ct);
        return NoContent();
    }

    [HttpPatch("{id:guid}/status")]
    [RequirePermission(Capabilities.CustomerWrite)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusRequest request, CancellationToken ct)
    {
        await mediator.Send(new UpdateCustomerStatusCommand(
            id, request.NewStatus, request.ServiceEndedAt, request.ChurnReason), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/archive")]
    [RequirePermission(Capabilities.CustomerArchive)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Archive(Guid id, CancellationToken ct)
    {
        await mediator.Send(new ArchiveCustomerCommand(id), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/restore")]
    [RequirePermission(Capabilities.CustomerArchive)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Restore(Guid id, CancellationToken ct)
    {
        await mediator.Send(new RestoreCustomerCommand(id), ct);
        return NoContent();
    }

    // --- Products ---

    [HttpPost("{customerId:guid}/products")]
    [RequirePermission(Capabilities.CustomerWrite)]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddProduct(Guid customerId, [FromBody] AddProductRequest request, CancellationToken ct)
    {
        var id = await mediator.Send(new AddProductToCustomerCommand(
            customerId, request.ProductId, request.UsageMode, request.Notes), ct);
        return Created(string.Empty, new { id });
    }

    [HttpDelete("{customerId:guid}/customer-products/{customerProductId:guid}")]
    [RequirePermission(Capabilities.CustomerWrite)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> RemoveProduct(Guid customerId, Guid customerProductId, CancellationToken ct)
    {
        await mediator.Send(new RemoveCustomerProductCommand(customerProductId), ct);
        return NoContent();
    }

    [HttpPatch("{customerId:guid}/products/{productId:guid}/status")]
    [RequirePermission(Capabilities.CustomerWrite)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateProductStatus(
        Guid customerId, Guid productId,
        [FromBody] UpdateProductStatusRequest request, CancellationToken ct)
    {
        await mediator.Send(new UpdateCustomerProductStatusCommand(
            customerId, productId, request.NewStatus, request.GoLiveAt, request.DiscontinuedAt), ct);
        return NoContent();
    }

    // --- VPN Configs ---

    [HttpGet("{customerId:guid}/vpn-configs")]
    [RequirePermission(Capabilities.CustomerRead)]
    [ProducesResponseType(typeof(IReadOnlyList<CustomerVpnConfigDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVpnConfigs(Guid customerId, CancellationToken ct)
        => Ok(await mediator.Send(new GetCustomerVpnConfigsQuery(customerId), ct));

    [HttpPost("{customerId:guid}/vpn-configs")]
    [RequirePermission(Capabilities.CustomerWrite)]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateVpnConfig(Guid customerId, [FromBody] CreateVpnConfigRequest request, CancellationToken ct)
    {
        var id = await mediator.Send(new CreateCustomerVpnConfigCommand(
            customerId, request.CustomerEnvironmentId, request.Name, request.VpnType,
            request.ServerHost, request.ServerPort, request.Username, request.PlainPassword,
            request.Notes, request.IsActive, request.SortOrder), ct);
        return Created(string.Empty, new { id });
    }

    [HttpPut("{customerId:guid}/vpn-configs/{id:guid}")]
    [RequirePermission(Capabilities.CustomerWrite)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateVpnConfig(Guid customerId, Guid id, [FromBody] UpdateVpnConfigRequest request, CancellationToken ct)
    {
        await mediator.Send(new UpdateCustomerVpnConfigCommand(
            id, request.CustomerEnvironmentId, request.Name, request.VpnType,
            request.ServerHost, request.ServerPort, request.Username, request.PlainPassword,
            request.Notes, request.IsActive, request.SortOrder), ct);
        return NoContent();
    }

    [HttpDelete("{customerId:guid}/vpn-configs/{id:guid}")]
    [RequirePermission(Capabilities.CustomerWrite)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteVpnConfig(Guid customerId, Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteCustomerVpnConfigCommand(id), ct);
        return NoContent();
    }

    [HttpGet("{customerId:guid}/vpn-configs/{id:guid}/reveal-password")]
    [RequirePermission(Capabilities.CredentialView)]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RevealPassword(Guid customerId, Guid id, CancellationToken ct)
        => Ok(await mediator.Send(new RevealVpnPasswordCommand(id), ct));
}

public sealed record UpdateCustomerRequest(
    string Name, string? ShortName, string? Description,
    string? Sector, string? Country, string? City,
    string? PrimaryContactName, string? PrimaryContactEmail, string? PrimaryContactPhone,
    Dictionary<string, object?>? CustomFields);

public sealed record UpdateStatusRequest(CustomerStatus NewStatus, DateOnly? ServiceEndedAt, string? ChurnReason);
public sealed record AddProductRequest(Guid ProductId, UsageMode UsageMode, string? Notes);
public sealed record UpdateProductStatusRequest(CustomerProductStatus NewStatus, DateOnly? GoLiveAt, DateOnly? DiscontinuedAt);

public sealed record CreateVpnConfigRequest(
    Guid? CustomerEnvironmentId, string Name, VpnType VpnType,
    string ServerHost, int? ServerPort, string? Username, string? PlainPassword,
    string? Notes, bool IsActive = true, int SortOrder = 0);

public sealed record UpdateVpnConfigRequest(
    Guid? CustomerEnvironmentId, string Name, VpnType VpnType,
    string ServerHost, int? ServerPort, string? Username, string? PlainPassword,
    string? Notes, bool IsActive, int SortOrder);
