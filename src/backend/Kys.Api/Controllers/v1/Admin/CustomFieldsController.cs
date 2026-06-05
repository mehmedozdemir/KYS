using Asp.Versioning;
using Kys.Api.Authorization;
using Kys.Application.CustomFields.Commands.CreateCustomFieldDefinition;
using Kys.Application.CustomFields.Commands.ToggleCustomFieldDefinition;
using Kys.Application.CustomFields.Commands.UpdateCustomFieldDefinition;
using Kys.Application.CustomFields.Queries.GetCustomFieldDefinitions;
using Kys.Domain.Entities;
using Kys.Domain.Enumerations;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Kys.Api.Controllers.v1.Admin;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/custom-fields")]
[RequirePermission(SystemRole.Codes.PlatformAdmin)]
public sealed class CustomFieldsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<CustomFieldDefinitionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] CustomFieldEntityType entityType,
        [FromQuery] bool activeOnly = true,
        CancellationToken ct = default)
        => Ok(await mediator.Send(new GetCustomFieldDefinitionsQuery(entityType, activeOnly), ct));

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Create([FromBody] CreateCustomFieldDefinitionCommand command, CancellationToken ct)
    {
        var id = await mediator.Send(command, ct);
        return Created(string.Empty, new { id });
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCustomFieldDefinitionRequest request, CancellationToken ct)
    {
        await mediator.Send(new UpdateCustomFieldDefinitionCommand(
            id, request.DisplayName, request.IsRequired, request.DefaultValue,
            request.SelectOptions, request.ValidationRules, request.DisplayOrder, request.GroupName), ct);
        return NoContent();
    }

    [HttpPatch("{id:guid}/toggle")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Toggle(Guid id, CancellationToken ct)
    {
        var isActive = await mediator.Send(new ToggleCustomFieldDefinitionCommand(id), ct);
        return Ok(new { isActive });
    }
}

public sealed record UpdateCustomFieldDefinitionRequest(
    string DisplayName,
    bool IsRequired,
    string? DefaultValue,
    List<string>? SelectOptions,
    Dictionary<string, object?>? ValidationRules,
    int DisplayOrder,
    string? GroupName);
